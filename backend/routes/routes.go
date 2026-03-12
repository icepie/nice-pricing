package routes

import (
	"embed"
	"io/fs"
	"net/http"

	"nice-pricing/config"
	"nice-pricing/handlers"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func Setup(r *gin.Engine, staticFiles embed.FS) {
	r.Use(cors.New(cors.Config{
		AllowOrigins: config.C.CORSOrigins,
		AllowMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders: []string{"Content-Type"},
	}))

	// OpenAI-compatible endpoint for new-api channel/fetch_models
	r.GET("/v1/models", handlers.OpenAIModels)

	api := r.Group("/api")
	{
		api.GET("/providers", handlers.GetProviders)
		api.POST("/providers", handlers.CreateProvider)
		api.PUT("/providers/:id", handlers.UpdateProvider)
		api.DELETE("/providers/:id", handlers.DeleteProvider)

		api.GET("/models", handlers.GetModels)
		api.POST("/models", handlers.CreateModel)
		api.PUT("/models/:id", handlers.UpdateModel)
		api.DELETE("/models/:id", handlers.DeleteModel)
		api.POST("/models/batch/:action", handlers.BatchSetEnabled)

		api.GET("/models/:id/price", handlers.GetPrice)
		api.POST("/models/:id/price", handlers.UpsertPrice)
		api.GET("/models/:id/history", handlers.GetPriceHistory)

		api.GET("/compare", handlers.CompareModels)

		// new-api upstream compatibility
		api.GET("/newapi/models.json", handlers.NewAPIModels)
		api.GET("/newapi/vendors.json", handlers.NewAPIVendors)

		// new-api ratio_sync compatibility
		api.GET("/pricing", handlers.NewAPIPricing)
		api.GET("/ratio_config", handlers.NewAPIRatioConfig)
	}

	// Serve embedded frontend; fallback to index.html for SPA routing
	distFS, _ := fs.Sub(staticFiles, "dist")
	fileServer := http.FileServer(http.FS(distFS))
	r.NoRoute(func(c *gin.Context) {
		// Try to serve the file; if not found, serve index.html
		_, err := distFS.Open(c.Request.URL.Path[1:])
		if err != nil {
			c.FileFromFS("index.html", http.FS(distFS))
			return
		}
		fileServer.ServeHTTP(c.Writer, c.Request)
	})
}

