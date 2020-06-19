package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"strconv"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	mongoDriver "go.mongodb.org/mongo-driver/mongo"
	mongoOptions "go.mongodb.org/mongo-driver/mongo/options"

	redis "github.com/go-redis/redis/v8"

	"github.com/gin-contrib/gzip"
	"github.com/gin-contrib/static"
	"github.com/gin-gonic/gin"
	cors "github.com/itsjamie/gin-cors"

	"github.com/spf13/viper"
)

type ChannelInfo struct {
	Channel int32
	Values  []int32
	From    time.Time
	To      time.Time
}

type MongoChannelInfo struct {
	ID      primitive.ObjectID `bson:"_id,omitempty"`
	Channel int32              `bson:"channel,omitempty"`
	Values  []int32            `bson:"values,omitempty"`
	From    time.Time          `bson:"from,omitempty"`
	To      time.Time          `bson:"to,omitempty"`
}

type AveragedChannelInfo struct {
	Channel     int32
	Value       float64
	Thresholded int32
	Averaged    float64
	From        time.Time
	To          time.Time
}

type Occupacy struct {
	Channel  int32
	Occupacy float64
}

func tick(start time.Time) {
	start = time.Now()
}

func tock(start time.Time, text string) {
	t := time.Now()
	elapsed := t.Sub(start)
	durStr := fmtDuration(elapsed)
	fmt.Println(fmt.Sprintf("Elapsed: %s: %s", durStr, text))
	tick(start)
}

func fmtDuration(d time.Duration) string {
	d = d.Round(time.Second)

	h := d / time.Hour
	d -= h * time.Hour

	m := d / time.Minute
	d -= m * time.Minute

	s := d / time.Second
	return fmt.Sprintf("%02d:%02d:%02d", h, m, s)
}

func averageInt(xs []int32) float64 {
	total := int32(0)
	for _, v := range xs {
		total += v
	}
	return float64(total) / float64(len(xs))
}

func averageFloat(xs []float64) float64 {
	total := float64(0)
	for _, v := range xs {
		total += v
	}
	return float64(total) / float64(len(xs))
}

func filter(arr []AveragedChannelInfo, cmp func(AveragedChannelInfo) bool) (ret []AveragedChannelInfo) {
	for _, s := range arr {
		if cmp(s) {
			ret = append(ret, s)
		}
	}
	return
}

func filterMongo(arr []MongoChannelInfo, cmp func(MongoChannelInfo) bool) (ret []MongoChannelInfo) {
	for _, s := range arr {
		if cmp(s) {
			ret = append(ret, s)
		}
	}
	return
}

func sum(array []AveragedChannelInfo) float64 {
	var result float64 = 0
	for _, v := range array {
		result += v.Averaged
	}
	return result
}

func getMongoDb(db *mongoDriver.Database, cli *mongoDriver.Client) (*mongoDriver.Database, error) {
	if db != nil {
		return db, nil
	}

	db = cli.Database(viper.GetString("mongo.database"))
	return db, nil
}

func getRedisCli() *redis.Client {
	return redis.NewClient(&redis.Options{
		Addr:         fmt.Sprintf("%s:%s", viper.GetString("redis.url"), viper.GetString("redis.port")), // use default Addr
		Password:     viper.GetString("redis.password"),                                                 // no password set
		DB:           viper.GetInt("redis.database"),                                                 // use default DB
		ReadTimeout:  1000 * time.Second,
		WriteTimeout: 1000 * time.Second,
	})
}

func main() {
	var start time.Time

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

	r.Use(gzip.Gzip(gzip.DefaultCompression))

	r.Use(static.Serve("/", static.LocalFile("./client/build", true)))

	viper.SetConfigName("settings")
	viper.SetConfigType("json")
	viper.AddConfigPath(".")
	err := viper.ReadInConfig() // Find and read the config file
	if err != nil {             // Handle errors reading the config file
		viper.SetConfigName("settings.default")
		err := viper.ReadInConfig() // Find and read the config file
		if err != nil {             // Handle errors reading the config file
			panic(fmt.Errorf("Fatal error config file: %s", err))
		}
	}

	mcli, _ := mongoDriver.NewClient(mongoOptions.Client().ApplyURI(fmt.Sprintf("mongodb://%s:%s@%s:%s", viper.GetString("mongo.user"), viper.GetString("mongo.password"), viper.GetString("mongo.url"), viper.GetString("mongo.port"))))
	mcli.Connect(context.Background())

	collectionName := viper.GetString("mongo.collection")

	var mdb *mongoDriver.Database = nil

	r.GET("redis/flush", func(c *gin.Context) {
		redisClient := getRedisCli()
		redisClient.FlushAll(c)
	})

	r.GET("mongo/occupacy/band/:band/threshold/:threshold", func(c *gin.Context) {
		/*
			U-NII-1: 1 (#36) a 4 (#48)
			U-NII-2: 5 (#52) a 8 (#64)
			U-NII-2-C1: 9 (#100) a 12 (#112)
			U-NII-2-C2: 13 (#116) a 16 (#128)
			U-NII-2-C3: 17 (#132) a 20 (#144)
			U-NII-3: 21 (#149) a 24 (#161)
		*/
		ctx := c
		band, _ := strconv.Atoi(c.Params.ByName("band"))
		threshold, _ := strconv.ParseFloat(c.Params.ByName("threshold"), 64)
		query := fmt.Sprintf("mongo/occupacy/band/%s/threshold/%s", band, threshold)

		bandBase := int32(4 * (band - 1))
		channelsInBand := [4]int32{bandBase + 1, bandBase + 2, bandBase + 3, bandBase + 4}

		tick(start)

		redisClient := getRedisCli()

		var rows []MongoChannelInfo
		var occ float64 = 0

		val, err := redisClient.Get(c, query).Result()

		if err != nil {
			fmt.Println("Values are not stored : ", err)

			mdb, _ = getMongoDb(mdb, mcli)

			// collection := mdb.Collection("channel_info_list_averaged_from_1_to_100")
			collection := mdb.Collection(collectionName)

			cur, err := collection.Find(ctx, bson.D{{"channel", bson.D{{"$in", channelsInBand}}}})

			if err = cur.All(ctx, &rows); err != nil {
				log.Fatal(err)
			}

			tock(start, fmt.Sprintf("Database time. Band %d", band))

			data := make([]AveragedChannelInfo, len(rows))

			for _, row := range rows {

				var avg AveragedChannelInfo

				for j, value := range row.Values {
					if float64(value) < threshold {
						row.Values[j] = 0
					} else {
						row.Values[j] = 1
					}
				}

				avg.Channel = row.Channel
				avg.Averaged = averageInt(row.Values)

				data = append(data, avg)
			}

			tock(start, fmt.Sprintf("Parse time. Band %d", band))

			for _, channel := range channelsInBand {
				cmp := func(d AveragedChannelInfo) bool { return d.Channel == channel }
				values := filter(data, cmp)
				sum := sum(values)
				occ += sum / float64(len(values))
			}

			tock(start, fmt.Sprintf("Occupancy time. Band %d", band))

			occ /= 4

			err = redisClient.Set(c, query, occ, 0).Err()
			if err != nil {
				fmt.Println("error storing data", err)
			}

			tock(start, fmt.Sprintf("Store cache time. Band %d", band))

		} else {
			occ, _ = strconv.ParseFloat(val, 64)
		}

		c.JSON(200, gin.H{
			"band": band,
			"data": occ,
		})
	})

	r.GET("mongo/occupacy/channel/:channel/threshold/:threshold", func(c *gin.Context) {
		ctx := c
		channel, _ := strconv.Atoi(c.Params.ByName("channel"))
		threshold, _ := strconv.ParseFloat(c.Params.ByName("threshold"), 64)
		query := fmt.Sprintf("mongo/occupacy/channel/%s/threshold/%s", channel, threshold)

		tick(start)

		redisClient := getRedisCli()

		var rows []MongoChannelInfo
		var occ float64 = 0

		val, err := redisClient.Get(c, query).Result()

		if err != nil {
			fmt.Println("Values are not stored : ", err)

			mdb, _ = getMongoDb(mdb, mcli)

			// collection := mdb.Collection("channel_info_list_averaged_from_1_to_100")
			collection := mdb.Collection(collectionName)

			cur, err := collection.Find(ctx, bson.D{{"channel", channel}})

			if err != nil {
				fmt.Println("ERROR IN INTERLINKING COUNT CURSOR : ", err)
			}

			if err = cur.All(ctx, &rows); err != nil {
				log.Fatal(err)
			}

			tock(start, fmt.Sprintf("DB time. Channel %d", channel))

			fmt.Println(fmt.Sprintf("len(rows) = %d", len(rows)))
			data := make([]AveragedChannelInfo, len(rows))
			fmt.Println(fmt.Sprintf("row.channel = %d", rows[0].Channel))

			for _, row := range rows {

				var avg AveragedChannelInfo

				for j, value := range row.Values {
					if float64(value) < threshold {
						row.Values[j] = 0
					} else {
						row.Values[j] = 1
					}
				}

				avg.Channel = row.Channel
				avg.Averaged = averageInt(row.Values)

				data = append(data, avg)
			}

			sum := sum(data)
			occ += sum / float64(len(data))

			tock(start, fmt.Sprintf("Parse time. Channel %d", channel))

			err = redisClient.Set(c, query, occ, 0).Err()
			if err != nil {
				fmt.Println("error storing data", err)
			}
		} else {
			occ, _ = strconv.ParseFloat(val, 64)
		}

		c.JSON(200, gin.H{
			"channel": channel,
			"data":    occ,
		})
	})

	r.GET("mongo/occupacy/channels/threshold/:threshold", func(c *gin.Context) {
		ctx := c
		threshold, _ := strconv.ParseFloat(c.Params.ByName("threshold"), 64)
		query := fmt.Sprintf("mongo/occupacy/channels/threshold/%s", threshold)

		tick(start)

		redisClient := getRedisCli()

		var rows []MongoChannelInfo
		var occs []Occupacy

		val, err := redisClient.Get(c, query).Result()

		if err != nil {
			fmt.Println("Values are not stored : ", err)

			mdb, _ = getMongoDb(mdb, mcli)

			collection := mdb.Collection(collectionName)

			cur, err := collection.Find(ctx, bson.D{})

			if err != nil {
				fmt.Println("ERROR IN INTERLINKING COUNT CURSOR : ", err)
			}

			if err = cur.All(ctx, &rows); err != nil {
				log.Fatal(err)
			}

			var data []AveragedChannelInfo

			for c := 1; c <= 24; c++ {
				cmp := func(d MongoChannelInfo) bool { return d.Channel == int32(c) }
				cRows := filterMongo(rows, cmp)

				for _, row := range cRows {

					var avg AveragedChannelInfo

					for j, value := range row.Values {
						if float64(value) < threshold {
							row.Values[j] = 0
						} else {
							row.Values[j] = 1
						}
					}

					avg.Channel = row.Channel
					avg.Averaged = averageInt(row.Values)

					data = append(data, avg)
				}

				sum := sum(data)

				occ := Occupacy{
					Channel:  int32(c),
					Occupacy: sum / float64(len(data)),
				}

				occs = append(occs, occ)
			}

			serialized, _ := json.Marshal(occs)

			err = redisClient.Set(c, query, serialized, 0).Err()
			if err != nil {
				fmt.Println("error storing data", err)
			}

		} else {
			json.Unmarshal([]byte(val), &occs)
		}

		c.JSON(200, gin.H{
			"data": occs,
		})
	})

	r.GET("mongo/values/channels/threshold/:threshold/ratio/:ratio", func(c *gin.Context) {
		ctx := c
		threshold, _ := strconv.ParseFloat(c.Params.ByName("threshold"), 64)
		ratio, _ := strconv.ParseInt(c.Params.ByName("ratio"), 10, 16)

		var rows []MongoChannelInfo
		var data []AveragedChannelInfo

		tick(start)

		redisClient := getRedisCli()

		for ch := 1; ch <= 24; ch++ {
			query := fmt.Sprintf("mongo/values/channel/%d/threshold/%d/ratio/%d", ch, threshold, ratio)

			var sdata []AveragedChannelInfo

			val, err := redisClient.Get(c, query).Result()

			if err != nil {
				mdb, _ = getMongoDb(mdb, mcli)

				collection := mdb.Collection(collectionName)

				cur, err := collection.Find(ctx, bson.D{{"channel", ch}})

				if err = cur.All(c, &rows); err != nil {
					log.Fatal(err)
				}

				tock(start, fmt.Sprintf("Database time. Channel %d", ch))

				var ravg []AveragedChannelInfo
				var irow int = 1
				for _, row := range rows {
					var avg AveragedChannelInfo

					for j, value := range row.Values {
						if float64(value) < threshold {
							row.Values[j] = 0
						} else {
							row.Values[j] = 1
						}
					}

					avg.From = row.From
					avg.Channel = row.Channel
					avg.Averaged = averageInt(row.Values)

					ravg = append(ravg, avg)

					if int64(irow)%ratio == 0 {
						var vavg []float64
						for _, a := range ravg {
							vavg = append(vavg, a.Averaged)
						}

						avg := AveragedChannelInfo{
							Channel:  ravg[0].Channel,
							From:     ravg[0].From,
							Averaged: averageFloat(vavg),
						}

						sdata = append(sdata, avg)

						irow = 0
						ravg = nil
					}
					irow++
				}

				tock(start, fmt.Sprintf("Parse time. Channel %d", ch))

				serialized, _ := json.Marshal(sdata)

				err = redisClient.Set(c, query, serialized, 0).Err()
				if err != nil {
					fmt.Println("error storing data", err)
				}

				tock(start, fmt.Sprintf("Store cache time. Channel %d", ch))

				data = append(data, sdata...)
			} else {
				fmt.Println("unmarshalling")
				json.Unmarshal([]byte(val), &sdata)

				data = append(data, sdata...)
			}
		}

		c.JSON(200, gin.H{
			"data": data,
		})
	})

	r.Run(":8080")

}
