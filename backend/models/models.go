package models

import "time"

type Provider struct {
	ID      uint   `json:"id" gorm:"primaryKey"`
	Name    string `json:"name" gorm:"not null;unique"`
	Website string `json:"website"`
	Icon    string `json:"icon"`
}

type AIModel struct {
	ID            uint     `json:"id" gorm:"primaryKey"`
	ProviderID    uint     `json:"provider_id" gorm:"not null"`
	Provider      Provider `json:"provider" gorm:"foreignKey:ProviderID"`
	Name          string   `json:"name" gorm:"not null"`
	DisplayName   string   `json:"display_name"`
	ContextWindow int      `json:"context_window"`
	Description   string   `json:"description"`
	Icon          string   `json:"icon"`
	Tags          string   `json:"tags"`
	Enabled       bool     `json:"enabled" gorm:"default:true"`
}

type Price struct {
	ID                    uint      `json:"id" gorm:"primaryKey"`
	ModelID               uint      `json:"model_id" gorm:"not null;unique"`
	InputPricePer1M       float64   `json:"input_price_per_1m"       gorm:"column:input_price_per_1m"`
	OutputPricePer1M      float64   `json:"output_price_per_1m"      gorm:"column:output_price_per_1m"`
	CacheReadPricePer1M   float64   `json:"cache_read_price_per_1m"  gorm:"column:cache_read_price_per_1m"`
	CacheWritePricePer1M  float64   `json:"cache_write_price_per_1m" gorm:"column:cache_write_price_per_1m"`
	InputAudioPricePer1M  float64   `json:"input_audio_price_per_1m" gorm:"column:input_audio_price_per_1m"`
	OutputAudioPricePer1M float64   `json:"output_audio_price_per_1m" gorm:"column:output_audio_price_per_1m"`
	Currency              string    `json:"currency" gorm:"default:USD"`
	EffectiveDate         time.Time `json:"effective_date"`
	Notes                 string    `json:"notes"`
}

type PriceHistory struct {
	ID                    uint      `json:"id" gorm:"primaryKey"`
	ModelID               uint      `json:"model_id" gorm:"not null"`
	InputPricePer1M       float64   `json:"input_price_per_1m"       gorm:"column:input_price_per_1m"`
	OutputPricePer1M      float64   `json:"output_price_per_1m"      gorm:"column:output_price_per_1m"`
	CacheReadPricePer1M   float64   `json:"cache_read_price_per_1m"  gorm:"column:cache_read_price_per_1m"`
	CacheWritePricePer1M  float64   `json:"cache_write_price_per_1m" gorm:"column:cache_write_price_per_1m"`
	InputAudioPricePer1M  float64   `json:"input_audio_price_per_1m" gorm:"column:input_audio_price_per_1m"`
	OutputAudioPricePer1M float64   `json:"output_audio_price_per_1m" gorm:"column:output_audio_price_per_1m"`
	Currency              string    `json:"currency"`
	EffectiveDate         time.Time `json:"effective_date"`
	Notes                 string    `json:"notes"`
	RecordedAt            time.Time `json:"recorded_at" gorm:"autoCreateTime"`
}
