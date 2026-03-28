package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
)

var allowedOrigins = map[string]struct{}{
	"http://app.example.com:3000":  {},
	"http://app2.example.com:3001": {},
}

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("/me", withCORS(handleMe))

	fmt.Println("api server running on :8081")
	if err := http.ListenAndServe(":8081", mux); err != nil {
		log.Fatalf("server failed: %v", err)
	}
}

func handleMe(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}

	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// If login.example.com set session_id with Domain=.example.com, the browser can send it here too.
	_, err := r.Cookie("session_id")
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "unauthorized"})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]string{"user": "admin"})
}

func withCORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if _, ok := allowedOrigins[origin]; ok {
			// Credentialed cross-origin requests require explicit origin and Allow-Credentials=true.
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Credentials", "true")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
			w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
			w.Header().Set("Vary", "Origin")
		}
		next(w, r)
	}
}
