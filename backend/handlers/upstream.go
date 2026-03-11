package handlers

import (
	"encoding/json"
	"net/http"

	"nice-pricing/database"
	"nice-pricing/models"

	"github.com/gin-gonic/gin"
)

// upstreamEnvelope matches new-api's expected response format
type upstreamEnvelope[T any] struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	Data    []T    `json:"data"`
}

type upstreamVendor struct {
	Description string `json:"description"`
	Icon        string `json:"icon"`
	Name        string `json:"name"`
	Status      int    `json:"status"`
}

type upstreamModel struct {
	Description string          `json:"description"`
	Endpoints   json.RawMessage `json:"endpoints"`
	Icon        string          `json:"icon"`
	ModelName   string          `json:"model_name"`
	NameRule    int             `json:"name_rule"`
	Status      int             `json:"status"`
	Tags        string          `json:"tags"`
	VendorName  string          `json:"vendor_name"`
}

// NewAPIVendors serves /api/newapi/vendors.json
func NewAPIVendors(c *gin.Context) {
	var providers []models.Provider
	database.DB.Find(&providers)

	vendors := make([]upstreamVendor, 0, len(providers))
	for _, p := range providers {
		vendors = append(vendors, upstreamVendor{
			Name:   p.Name,
			Status: 1,
		})
	}
	c.JSON(http.StatusOK, upstreamEnvelope[upstreamVendor]{Success: true, Data: vendors})
}

// NewAPIModels serves /api/newapi/models.json — only enabled models
func NewAPIModels(c *gin.Context) {
	var ms []models.AIModel
	database.DB.Preload("Provider").Where("enabled = ?", true).Find(&ms)

	out := make([]upstreamModel, 0, len(ms))
	for _, m := range ms {
		out = append(out, upstreamModel{
			ModelName:   m.Name,
			VendorName:  m.Provider.Name,
			Description: m.Description,
			Icon:        m.Icon,
			Tags:        m.Tags,
			Status:      1,
			NameRule:    0,
			Endpoints:   json.RawMessage(`null`),
		})
	}
	c.JSON(http.StatusOK, upstreamEnvelope[upstreamModel]{Success: true, Data: out})
}

// OpenAIModels serves GET /v1/models — OpenAI-compatible endpoint
// new-api calls this when fetching models from an upstream channel
func OpenAIModels(c *gin.Context) {
	var ms []models.AIModel
	database.DB.Where("enabled = ?", true).Find(&ms)

	type modelObj struct {
		ID      string `json:"id"`
		Object  string `json:"object"`
		Created int64  `json:"created"`
		OwnedBy string `json:"owned_by"`
	}
	list := make([]modelObj, 0, len(ms))
	for _, m := range ms {
		list = append(list, modelObj{
			ID:      m.Name,
			Object:  "model",
			Created: 1700000000,
			OwnedBy: "nice-pricing",
		})
	}
	c.JSON(http.StatusOK, gin.H{
		"object": "list",
		"data":   list,
	})
}
