package handlers

import (
	"net/http"

	"nice-pricing/database"
	"nice-pricing/models"

	"github.com/gin-gonic/gin"
)

func GetProviders(c *gin.Context) {
	var providers []models.Provider
	database.DB.Find(&providers)
	c.JSON(http.StatusOK, providers)
}

func CreateProvider(c *gin.Context) {
	var p models.Provider
	if err := c.ShouldBindJSON(&p); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	database.DB.Create(&p)
	c.JSON(http.StatusCreated, p)
}

func UpdateProvider(c *gin.Context) {
	var p models.Provider
	if err := database.DB.First(&p, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	if err := c.ShouldBindJSON(&p); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	database.DB.Save(&p)
	c.JSON(http.StatusOK, p)
}

func DeleteProvider(c *gin.Context) {
	if err := database.DB.Delete(&models.Provider{}, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	c.Status(http.StatusNoContent)
}
