package handlers

import (
	"net/http"
	"time"

	"nice-pricing/database"
	"nice-pricing/models"

	"github.com/gin-gonic/gin"
)

func GetPrice(c *gin.Context) {
	var price models.Price
	if err := database.DB.Where("model_id = ?", c.Param("id")).First(&price).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "no price found"})
		return
	}
	c.JSON(http.StatusOK, price)
}

func UpsertPrice(c *gin.Context) {
	modelID := c.Param("id")
	var input models.Price
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Write old price to history if exists
	var existing models.Price
	if err := database.DB.Where("model_id = ?", modelID).First(&existing).Error; err == nil {
		history := models.PriceHistory{
			ModelID:               existing.ModelID,
			InputPricePer1M:       existing.InputPricePer1M,
			OutputPricePer1M:      existing.OutputPricePer1M,
			CacheReadPricePer1M:   existing.CacheReadPricePer1M,
			CacheWritePricePer1M:  existing.CacheWritePricePer1M,
			InputAudioPricePer1M:  existing.InputAudioPricePer1M,
			OutputAudioPricePer1M: existing.OutputAudioPricePer1M,
			Currency:              existing.Currency,
			EffectiveDate:         existing.EffectiveDate,
			Notes:                 existing.Notes,
		}
		database.DB.Create(&history)
		existing.InputPricePer1M = input.InputPricePer1M
		existing.OutputPricePer1M = input.OutputPricePer1M
		existing.CacheReadPricePer1M = input.CacheReadPricePer1M
		existing.CacheWritePricePer1M = input.CacheWritePricePer1M
		existing.InputAudioPricePer1M = input.InputAudioPricePer1M
		existing.OutputAudioPricePer1M = input.OutputAudioPricePer1M
		existing.Currency = input.Currency
		existing.Notes = input.Notes
		if !input.EffectiveDate.IsZero() {
			existing.EffectiveDate = input.EffectiveDate
		} else {
			existing.EffectiveDate = time.Now()
		}
		database.DB.Save(&existing)
		c.JSON(http.StatusOK, existing)
	} else {
		// Create new
		input.ModelID = parseUint(modelID)
		if input.EffectiveDate.IsZero() {
			input.EffectiveDate = time.Now()
		}
		if input.Currency == "" {
			input.Currency = "USD"
		}
		database.DB.Create(&input)
		c.JSON(http.StatusCreated, input)
	}
}

func GetPriceHistory(c *gin.Context) {
	var history []models.PriceHistory
	database.DB.Where("model_id = ?", c.Param("id")).Order("recorded_at desc").Find(&history)
	c.JSON(http.StatusOK, history)
}

func CompareModels(c *gin.Context) {
	ids := c.Query("ids")
	if ids == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ids required"})
		return
	}

	type Result struct {
		Model models.AIModel `json:"model"`
		Price *models.Price  `json:"price"`
	}

	var modelList []models.AIModel
	database.DB.Preload("Provider").Where("id IN ?", splitIDs(ids)).Find(&modelList)

	results := make([]Result, 0, len(modelList))
	for _, m := range modelList {
		var price models.Price
		r := Result{Model: m}
		if database.DB.Where("model_id = ?", m.ID).First(&price).Error == nil {
			r.Price = &price
		}
		results = append(results, r)
	}
	c.JSON(http.StatusOK, results)
}

func parseUint(s string) uint {
	var n uint
	for _, c := range s {
		if c >= '0' && c <= '9' {
			n = n*10 + uint(c-'0')
		}
	}
	return n
}

func splitIDs(s string) []string {
	var ids []string
	cur := ""
	for _, c := range s {
		if c == ',' {
			if cur != "" {
				ids = append(ids, cur)
				cur = ""
			}
		} else {
			cur += string(c)
		}
	}
	if cur != "" {
		ids = append(ids, cur)
	}
	return ids
}
