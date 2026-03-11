package handlers

import (
	"math"
	"net/http"

	"nice-pricing/database"
	"nice-pricing/models"

	"github.com/gin-gonic/gin"
)

func round6(v float64) float64 {
	return math.Round(v*1e6) / 1e6
}

const usdRatio = 500.0 // $1 = 500 ratio units ($0.002 = 1 unit)

type pricingItem struct {
	ModelName       string  `json:"model_name"`
	QuotaType       int     `json:"quota_type"`
	ModelRatio      float64 `json:"model_ratio"`
	ModelPrice      float64 `json:"model_price"`
	CompletionRatio float64 `json:"completion_ratio"`
	CacheRatio      float64 `json:"cache_ratio,omitempty"`
	CreateCacheRatio float64 `json:"create_cache_ratio,omitempty"`
	AudioRatio      float64 `json:"audio_ratio,omitempty"`
	AudioCompletionRatio float64 `json:"audio_completion_ratio,omitempty"`
	OfficialInputPrice  float64 `json:"official_input_price"`
	OfficialOutputPrice float64 `json:"official_output_price"`
}

func loadPricedModels() ([]models.AIModel, []models.Price, error) {
	var ms []models.AIModel
	if err := database.DB.Preload("Provider").Where("enabled = ?", true).Find(&ms).Error; err != nil {
		return nil, nil, err
	}
	var prices []models.Price
	if err := database.DB.Find(&prices).Error; err != nil {
		return nil, nil, err
	}
	return ms, prices, nil
}

func buildPricingItems(ms []models.AIModel, prices []models.Price) []pricingItem {
	priceMap := make(map[uint]models.Price, len(prices))
	for _, p := range prices {
		priceMap[p.ModelID] = p
	}

	items := make([]pricingItem, 0, len(ms))
	for _, m := range ms {
		p, ok := priceMap[m.ID]
		if !ok || p.InputPricePer1M == 0 {
			continue
		}

		item := pricingItem{
			ModelName:           m.Name,
			OfficialInputPrice:  p.InputPricePer1M,
			OfficialOutputPrice: p.OutputPricePer1M,
			ModelRatio:          round6(p.InputPricePer1M * usdRatio / 1000.0),
		}
		if p.InputPricePer1M > 0 {
			item.CompletionRatio = round6(p.OutputPricePer1M / p.InputPricePer1M)
			if p.CacheReadPricePer1M > 0 {
				item.CacheRatio = round6(p.CacheReadPricePer1M / p.InputPricePer1M)
			}
			if p.CacheWritePricePer1M > 0 {
				item.CreateCacheRatio = round6(p.CacheWritePricePer1M / p.InputPricePer1M)
			}
			if p.InputAudioPricePer1M > 0 {
				item.AudioRatio = round6(p.InputAudioPricePer1M / p.InputPricePer1M)
			}
			if p.OutputAudioPricePer1M > 0 {
				item.AudioCompletionRatio = round6(p.OutputAudioPricePer1M / p.InputPricePer1M)
			}
		}
		items = append(items, item)
	}
	return items
}

// NewAPIPricing serves /api/pricing — Type2 format consumed by new-api ratio_sync
func NewAPIPricing(c *gin.Context) {
	ms, prices, err := loadPricedModels()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	items := buildPricingItems(ms, prices)
	c.JSON(http.StatusOK, gin.H{"success": true, "data": items})
}

// NewAPIRatioConfig serves /api/ratio_config — Type1 format consumed by new-api ratio_sync
func NewAPIRatioConfig(c *gin.Context) {
	ms, prices, err := loadPricedModels()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	items := buildPricingItems(ms, prices)

	modelRatio := make(map[string]float64, len(items))
	completionRatio := make(map[string]float64, len(items))
	cacheRatio := make(map[string]float64)
	createCacheRatio := make(map[string]float64)

	for _, item := range items {
		modelRatio[item.ModelName] = item.ModelRatio
		completionRatio[item.ModelName] = item.CompletionRatio
		if item.CacheRatio > 0 {
			cacheRatio[item.ModelName] = item.CacheRatio
		}
		if item.CreateCacheRatio > 0 {
			createCacheRatio[item.ModelName] = item.CreateCacheRatio
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"model_ratio":        modelRatio,
			"completion_ratio":   completionRatio,
			"cache_ratio":        cacheRatio,
			"create_cache_ratio": createCacheRatio,
		},
	})
}
