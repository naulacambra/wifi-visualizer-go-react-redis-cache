package main

import (
	"context"
	"fmt"
	"sort"

	"strconv"
	"time"

	"github.com/arangodb/go-driver"
	arangohttp "github.com/arangodb/go-driver/http"
	"github.com/gin-contrib/gzip"
	cors "github.com/itsjamie/gin-cors"

	"github.com/gin-gonic/gin"
)

type ChannelInfo struct {
	Channel int
	Values  []int
	From    time.Time
	To      time.Time
}

func fmtDuration(d time.Duration) string {
	d = d.Round(time.Minute)
	h := d / time.Hour
	d -= h * time.Hour
	m := d / time.Minute
	return fmt.Sprintf("%02d:%02d", h, m)
}

func main() {
	CHANNEL_AMOUNT := 24

	r := gin.Default()

	r.Use(cors.Middleware(cors.Config{
		Origins:         "*",
		Methods:         "GET",
		RequestHeaders:  "Origin, Authorization, Content-Type",
		ExposedHeaders:  "",
		MaxAge:          50 * time.Second,
		Credentials:     true,
		ValidateHeaders: false,
	}))

	r.Use(gzip.Gzip(gzip.DefaultCompression, gzip.WithExcludedExtensions([]string{".html"})))

	r.Static("/json", "./json")
	r.Static("/css", "./css")
	r.Static("/js", "./js")

	r.StaticFile("/", "./index.html")

	conn, err := arangohttp.NewConnection(arangohttp.ConnectionConfig{
		Endpoints: []string{"http://localhost:8529"},
	})
	if err != nil {
		fmt.Println("Error in Arango Connection", err)
	}

	cli, err := driver.NewClient(driver.ClientConfig{
		Connection:     conn,
		Authentication: driver.BasicAuthentication("root", "root"),
	})
	if err != nil {
		fmt.Println("Error in Arango Client Creation", err)
	} else {
		fmt.Println("Arangodb client creation successful")
	}

	db, err := cli.Database(nil, "wifi-viewer")
	if err != nil {
		fmt.Println("Error in database selection : ", err)
	} else {
		fmt.Println("Selected Database wifi-viewer")
	}

	// r.GET("/", func(c *gin.Context) {
	// 	c.HTML(http.StatusOK, "index.html", gin.H{
	// 		"title": "WIFI Viewer",
	// 	})
	// })

	r.GET("/channel/:number/count", func(c *gin.Context) {
		ctx := driver.WithQueryCount(context.Background())
		number, _ := strconv.Atoi(c.Params.ByName("number"))

		query := "FOR doc IN channel_info_collection FILTER doc.Channel == @channel COLLECT WITH COUNT INTO length RETURN length"

		bindVars := map[string]interface{}{
			"channel": number,
		}

		cursor, err := db.Query(ctx, query, bindVars)
		if err != nil {
			fmt.Println("ERROIR IN INTERLINKING COUNT CURSOR : ", err)
		}

		defer cursor.Close()

		var count int

		cursor.ReadDocument(ctx, &count)

		c.JSON(200, gin.H{
			"rows": count,
		})
	})

	r.GET("/channel/:number/rows/:limit", func(c *gin.Context) {
		start := time.Now()

		ctx := driver.WithQueryCount(context.Background())
		number, _ := strconv.Atoi(c.Params.ByName("number"))
		limit, _ := strconv.Atoi(c.Params.ByName("limit"))

		query := "FOR doc IN channel_info_collection FILTER doc.Channel == @channel LIMIT @limit RETURN doc"

		bindVars := map[string]interface{}{
			"channel": number,
			"limit":   limit,
		}

		cursor, err := db.Query(ctx, query, bindVars)
		if err != nil {
			fmt.Println("ERROIR IN INTERLINKING COUNT CURSOR : ", err)
		}

		defer cursor.Close()

		count := int(cursor.Count())
		rows := make([]ChannelInfo, cursor.Count())

		for i := 0; i < count; i++ {
			var document ChannelInfo

			_, err := cursor.ReadDocument(ctx, &document)

			rows[i] = document

			if driver.IsNoMoreDocuments(err) {
				fmt.Println("NO MORE INTERLINKIGN COUUNT DOCUMENTS : ", err)
				break
			} else if err != nil {
				fmt.Println(" Error in record interlinking count  : ", err)
			}
		}

		t := time.Now()
		elapsed := t.Sub(start)
		durStr := fmtDuration(elapsed)

		fmt.Println(fmt.Sprintf("elapsed %s", durStr))

		c.JSON(200, gin.H{
			"data": rows,
		})
	})

	r.GET("/rows/:limit", func(c *gin.Context) {
		start := time.Now()

		ctx := driver.WithQueryCount(context.Background())
		limit, _ := strconv.Atoi(c.Params.ByName("limit"))

		rows := make([]ChannelInfo, CHANNEL_AMOUNT*limit)

		for channel := 1; channel <= CHANNEL_AMOUNT; channel++ {
			query := "FOR doc IN channel_info_collection FILTER doc.Channel == @channel LIMIT @limit RETURN doc"

			bindVars := map[string]interface{}{
				"channel": channel,
				"limit":   limit,
			}

			cursor, err := db.Query(ctx, query, bindVars)
			if err != nil {
				fmt.Println("ERROIR IN INTERLINKING COUNT CURSOR : ", err)
			}

			defer cursor.Close()

			count := int(cursor.Count())

			for i := 0; i < count; i++ {
				var document ChannelInfo

				_, err := cursor.ReadDocument(ctx, &document)

				rows[((channel-1)*count)+i] = document

				if driver.IsNoMoreDocuments(err) {
					fmt.Println("NO MORE INTERLINKIGN COUUNT DOCUMENTS : ", err)
					break
				} else if err != nil {
					fmt.Println(" Error in record interlinking count  : ", err)
				}
			}

			t := time.Now()
			elapsed := t.Sub(start)
			durStr := fmtDuration(elapsed)

			fmt.Println(fmt.Sprintf("finished channel %s", durStr))
		}

		t := time.Now()
		elapsed := t.Sub(start)
		durStr := fmtDuration(elapsed)

		fmt.Println(fmt.Sprintf("elapsed %s", durStr))

		sort.Slice(rows, func(i, j int) bool {
			return rows[i].Channel < rows[j].Channel
		})

		t = time.Now()
		elapsed = t.Sub(start)
		durStr = fmtDuration(elapsed)

		fmt.Println(fmt.Sprintf("elapsed %s", durStr))

		c.JSON(200, gin.H{
			"data": rows,
		})

		t = time.Now()
		elapsed = t.Sub(start)
		durStr = fmtDuration(elapsed)

		fmt.Println(fmt.Sprintf("elapsed %s", durStr))
	})

	r.GET("/rows/:limit/values/:length/loop", func(c *gin.Context) {
		ctx := driver.WithQueryCount(context.Background())
		limit, _ := strconv.Atoi(c.Params.ByName("limit"))
		length, _ := strconv.Atoi(c.Params.ByName("length"))

		rows := make([]ChannelInfo, CHANNEL_AMOUNT*limit)

		// Get rows
		for channel := 1; channel <= CHANNEL_AMOUNT; channel++ {
			query := `
				FOR doc IN channel_info_collection 
				FILTER doc.Channel == @channel 
				LIMIT @limit 
				RETURN {
					Channel: doc.Channel,
					Values: SLICE(doc.Values, 0, @length),
					From: doc.From
				}`

			bindVars := map[string]interface{}{
				"channel": channel,
				"limit":   limit,
				"length":  length,
			}

			cursor, err := db.Query(ctx, query, bindVars)
			if err != nil {
				fmt.Println("ERROR IN INTERLINKING COUNT CURSOR : ", err)
			}

			defer cursor.Close()

			count := int(cursor.Count())

			for i := 0; i < count; i++ {
				var document ChannelInfo

				_, err := cursor.ReadDocument(ctx, &document)

				rows[((channel-1)*count)+i] = document

				if driver.IsNoMoreDocuments(err) {
					break
				}
			}
		}

		c.JSON(200, gin.H{
			"data": rows,
		})
	})

	r.GET("/rows/:limit/values/:length", func(c *gin.Context) {
		ctx := driver.WithQueryCount(context.Background())
		limit, _ := strconv.Atoi(c.Params.ByName("limit"))
		length, _ := strconv.Atoi(c.Params.ByName("length"))

		rows := make([]ChannelInfo, CHANNEL_AMOUNT*limit)

		// Get rows
		// query := "FOR doc IN channel_info_collection FILTER doc.Channel == @channel LIMIT @limit RETURN { Channel: doc.Channel, Values: SLICE(doc.Values, 0, @length), From: doc.From }"
		query := `RETURN FLATTEN (
				    FOR c in 1..24
				        RETURN (FOR doc IN channel_info_collection
				        FILTER doc.Channel == c
				        LIMIT @limit
				        RETURN {
				            Channel: doc.Channel,
				            Values: SLICE(doc.Values, 0, @length),
				            From: doc.From
				        })
				    ,
				    1
				)`

		bindVars := map[string]interface{}{
			"limit":  limit,
			"length": length,
		}

		cursor, err := db.Query(ctx, query, bindVars)
		if err != nil {
			fmt.Println("ERROIR IN INTERLINKING COUNT CURSOR : ", err)
		}

		defer cursor.Close()

		count := int(cursor.Count())

		fmt.Println("COUNT CURSOR : ", count)

		cursor.ReadDocument(ctx, &rows)

		fmt.Println("ROWS LENGTH : ", len(rows))

		fmt.Println("ALL ROWS FETCHED")

		// Extend dates

		fmt.Println("ALL ROWS EXTENDED")

		c.JSON(200, gin.H{
			"data": rows,
		})
	})

	r.Run(":8080")

}
