package handlers

import (
	"net/http"

	"nice-pricing/database"
	"nice-pricing/models"

	"github.com/gin-gonic/gin"
)

func GetModels(c *gin.Context) {
	var ms []models.AIModel
	q := database.DB.Preload("Provider")
	if pid := c.Query("provider_id"); pid != "" {
		q = q.Where("provider_id = ?", pid)
	}
	q.Find(&ms)
	c.JSON(http.StatusOK, ms)
}

func CreateModel(c *gin.Context) {
	var m models.AIModel
	if err := c.ShouldBindJSON(&m); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	database.DB.Create(&m)
	database.DB.Preload("Provider").First(&m, m.ID)
	c.JSON(http.StatusCreated, m)
}

func UpdateModel(c *gin.Context) {
	var m models.AIModel
	if err := database.DB.First(&m, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	if err := c.ShouldBindJSON(&m); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	database.DB.Save(&m)
	database.DB.Preload("Provider").First(&m, m.ID)
	c.JSON(http.StatusOK, m)
}

func DeleteModel(c *gin.Context) {
	if err := database.DB.Delete(&models.AIModel{}, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	c.Status(http.StatusNoContent)
}

// BatchSetEnabled handles POST /api/models/batch-enable and /api/models/batch-disable
func BatchSetEnabled(c *gin.Context) {
	var body struct {
		IDs []uint `json:"ids"`
	}
	if err := c.ShouldBindJSON(&body); err != nil || len(body.IDs) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ids required"})
		return
	}
	enabled := c.Param("action") == "enable"
	database.DB.Model(&models.AIModel{}).Where("id IN ?", body.IDs).Update("enabled", enabled)
	c.JSON(http.StatusOK, gin.H{"success": true})
}
