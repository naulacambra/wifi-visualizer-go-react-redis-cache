package main

import (
	"context"
	"fmt"

	"github.com/arangodb/go-driver"
	"github.com/arangodb/go-driver/http"
)

func main() {
	conn, err := http.NewConnection(http.ConnectionConfig{
		Endpoints: []string{"http://localhost:8529"},
	})
	if err != nil {
		fmt.Println("Cannot connect")
		return
	}
	fmt.Println("Could connect")
	client, err := driver.NewClient(driver.ClientConfig{
		Connection:     conn,
		Authentication: driver.BasicAuthentication("root", "root"),
	})
	fmt.Println("Could get client")
	if err != nil {
		fmt.Println(err)
	}
	ctx := context.Background()
	db, err := client.Database(ctx, "wifi-viewer")

	if err != nil {
		fmt.Println("Could not get db")
	}
	fmt.Println("Could get db")

	found, err := db.CollectionExists(ctx, "myCollection")
	if err != nil {
		fmt.Println(err)
	}
	fmt.Println("collection is found", found)
}
