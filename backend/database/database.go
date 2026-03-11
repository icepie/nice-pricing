package database

import (
	"log"

	"nice-pricing/config"
	"nice-pricing/models"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB

func Init() {
	var err error
	DB, err = gorm.Open(sqlite.Open(config.C.DBPath), &gorm.Config{})
	if err != nil {
		log.Fatal("failed to connect database:", err)
	}

	err = DB.AutoMigrate(
		&models.Provider{},
		&models.AIModel{},
		&models.Price{},
		&models.PriceHistory{},
	)
	if err != nil {
		log.Fatal("failed to migrate database:", err)
	}
}
