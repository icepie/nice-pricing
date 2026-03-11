package config

import (
	"os"
	"strings"
)

type Config struct {
	Port        string
	DBPath      string
	CORSOrigins []string
}

var C = load()

func load() Config {
	port := getEnv("PORT", "8088")
	dbPath := getEnv("DB_PATH", "pricing.db")
	corsRaw := getEnv("CORS_ORIGINS", "http://localhost:5173")

	origins := []string{}
	for _, o := range strings.Split(corsRaw, ",") {
		o = strings.TrimSpace(o)
		if o != "" {
			origins = append(origins, o)
		}
	}

	return Config{
		Port:        port,
		DBPath:      dbPath,
		CORSOrigins: origins,
	}
}

func getEnv(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}
