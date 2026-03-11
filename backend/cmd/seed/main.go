package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"time"

	"nice-pricing/database"
	"nice-pricing/models"

	"gorm.io/gorm"
)

type devProvider struct {
	ID     string              `json:"id"`
	Name   string              `json:"name"`
	Doc    string              `json:"doc"`
	Models map[string]devModel `json:"models"`
}

type devModel struct {
	ID    string    `json:"id"`
	Name  string    `json:"name"`
	Cost  *devCost  `json:"cost"`
	Limit *devLimit `json:"limit"`
}

type devCost struct {
	Input       *float64 `json:"input"`
	Output      *float64 `json:"output"`
	CacheRead   *float64 `json:"cache_read"`
	CacheWrite  *float64 `json:"cache_write"`
	InputAudio  *float64 `json:"input_audio"`
	OutputAudio *float64 `json:"output_audio"`
}

type devLimit struct {
	Context int `json:"context"`
}

var officialProviders = []string{
	"openai", "anthropic", "google", "mistral", "xai",
	"deepseek", "cohere", "perplexity", "moonshotai", "zhipuai",
	"minimax", "stepfun", "alibaba", "groq", "cerebras",
}

func main() {
	database.Init()

	url := "https://models.dev/api.json"
	if len(os.Args) > 1 {
		url = os.Args[1]
	}

	log.Printf("Fetching %s ...", url)
	resp, err := http.Get(url)
	if err != nil {
		log.Fatal("fetch error:", err)
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)

	var all map[string]devProvider
	if err := json.Unmarshal(body, &all); err != nil {
		log.Fatal("parse error:", err)
	}

	var totalProviders, totalModels, totalPrices int

	for _, pid := range officialProviders {
		p, ok := all[pid]
		if !ok {
			log.Printf("  skip: %s not found", pid)
			continue
		}

		provider := models.Provider{Name: p.Name, Website: p.Doc}
		if res := database.DB.Where("name = ?", p.Name).FirstOrCreate(&provider); res.Error != nil {
			log.Printf("  provider error %s: %v", p.Name, res.Error)
			continue
		}
		totalProviders++

		for _, m := range p.Models {
			dbModel := models.AIModel{}
			err := database.DB.Where("provider_id = ? AND name = ?", provider.ID, m.ID).First(&dbModel).Error
			if err == gorm.ErrRecordNotFound {
				dbModel = models.AIModel{
					ProviderID:  provider.ID,
					Name:        m.ID,
					DisplayName: m.Name,
				}
				if m.Limit != nil {
					dbModel.ContextWindow = m.Limit.Context
				}
				database.DB.Create(&dbModel)
			} else if err == nil {
				updates := map[string]interface{}{"display_name": m.Name}
				if m.Limit != nil {
					updates["context_window"] = m.Limit.Context
				}
				database.DB.Model(&dbModel).Updates(updates)
			} else {
				continue
			}
			totalModels++

			if m.Cost == nil || m.Cost.Input == nil || m.Cost.Output == nil {
				continue
			}

			newPrice := models.Price{
				ModelID:          dbModel.ID,
				InputPricePer1M:  *m.Cost.Input,
				OutputPricePer1M: *m.Cost.Output,
				Currency:         "USD",
				EffectiveDate:    time.Now(),
				Notes:            "seeded from models.dev",
			}
			if m.Cost.CacheRead != nil {
				newPrice.CacheReadPricePer1M = *m.Cost.CacheRead
			}
			if m.Cost.CacheWrite != nil {
				newPrice.CacheWritePricePer1M = *m.Cost.CacheWrite
			}
			if m.Cost.InputAudio != nil {
				newPrice.InputAudioPricePer1M = *m.Cost.InputAudio
			}
			if m.Cost.OutputAudio != nil {
				newPrice.OutputAudioPricePer1M = *m.Cost.OutputAudio
			}

			existing := models.Price{}
			err = database.DB.Where("model_id = ?", dbModel.ID).First(&existing).Error
			if err == gorm.ErrRecordNotFound {
				database.DB.Create(&newPrice)
				totalPrices++
			} else if err == nil {
				database.DB.Create(&models.PriceHistory{
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
				})
				database.DB.Model(&existing).Updates(map[string]interface{}{
					"input_price_per_1m":        newPrice.InputPricePer1M,
					"output_price_per_1m":       newPrice.OutputPricePer1M,
					"cache_read_price_per_1m":   newPrice.CacheReadPricePer1M,
					"cache_write_price_per_1m":  newPrice.CacheWritePricePer1M,
					"input_audio_price_per_1m":  newPrice.InputAudioPricePer1M,
					"output_audio_price_per_1m": newPrice.OutputAudioPricePer1M,
					"effective_date":            time.Now(),
					"notes":                     "updated from models.dev",
				})
				totalPrices++
			}
		}

		log.Printf("  ✓ %s: %d models", p.Name, len(p.Models))
	}

	fmt.Printf("\nDone: %d providers, %d models, %d prices\n", totalProviders, totalModels, totalPrices)
}
