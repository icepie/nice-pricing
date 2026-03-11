package main

import (
	"log"

	"nice-pricing/config"
	"nice-pricing/database"
	"nice-pricing/routes"

	"github.com/gin-gonic/gin"
)

func main() {
	database.Init()

	r := gin.Default()
	routes.Setup(r)

	addr := ":" + config.C.Port
	log.Printf("Starting server on %s (DB: %s)", addr, config.C.DBPath)
	r.Run(addr)
}
