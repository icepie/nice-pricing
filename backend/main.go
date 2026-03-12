package main

import (
	"embed"
	"log"

	"nice-pricing/config"
	"nice-pricing/database"
	"nice-pricing/routes"

	"github.com/gin-gonic/gin"
)

//go:embed dist
var staticFiles embed.FS

func main() {
	database.Init()

	r := gin.Default()
	routes.Setup(r, staticFiles)

	addr := ":" + config.C.Port
	log.Printf("Starting server on %s (DB: %s)", addr, config.C.DBPath)
	r.Run(addr)
}
