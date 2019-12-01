package main

import (
	"context"
	"fmt"

	"github.com/arangodb/go-driver"
	"github.com/arangodb/go-driver/http"

	"github.com/gin-gonic/gin"
)

func getClient() driver.Client {
	conn, err := http.NewConnection(http.ConnectionConfig{
		Endpoints: []string{"http://localhost:8529"},
	})

	if err != nil {
		fmt.Println(err)
	}

	client, err := driver.NewClient(driver.ClientConfig{
		Connection:     conn,
		Authentication: driver.BasicAuthentication("root", "root"),
	})

	if err != nil {
		fmt.Println(err)
	}

	return client
}

func getDb(ctx context.Context, dbName string) driver.Database {
	client := getClient()
	db, err := client.Database(ctx, dbName)

	if err != nil {
		fmt.Println(err)
	}

	return db
}

func main() {
	r := gin.Default()
	ctx := context.Background()
	db := getDb(ctx, "wifi-viewer")

	r.GET("/collections/:name", func(c *gin.Context) {
		collection := c.Params.ByName("name")
		found, err := db.CollectionExists(ctx, collection)
		if err != nil {
			fmt.Println(err)
		}
		fmt.Println("collection is found", found)

		c.JSON(200, gin.H{
			"name":  collection,
			"found": found,
		})
	})

	r.Run(":8080")

}
