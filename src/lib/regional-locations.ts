// Demonstration locations for copies of the UK source dataset.
// These assignments do not change the source property records or GBP values.
export const regionalLocations: Record<
  string,
  readonly { city: string; country: string }[]
> = {
  Asia: [
    { city: "Singapore", country: "Singapore" },
    { city: "Tokyo", country: "Japan" },
    { city: "Hong Kong", country: "China" },
  ],
  Australia: [
    { city: "Sydney", country: "Australia" },
    { city: "Melbourne", country: "Australia" },
    { city: "Brisbane", country: "Australia" },
  ],
  Europe: [
    { city: "Paris", country: "France" },
    { city: "Amsterdam", country: "Netherlands" },
    { city: "Berlin", country: "Germany" },
  ],
  USA: [
    { city: "New York", country: "United States" },
    { city: "Chicago", country: "United States" },
    { city: "Dallas", country: "United States" },
  ],
  Africa: [
    { city: "Cape Town", country: "South Africa" },
    { city: "Nairobi", country: "Kenya" },
    { city: "Casablanca", country: "Morocco" },
  ],
  "Middle East": [
    { city: "Dubai", country: "United Arab Emirates" },
    { city: "Riyadh", country: "Saudi Arabia" },
    { city: "Doha", country: "Qatar" },
  ],
  "Rest of the World": [
    { city: "Vancouver", country: "Canada" },
    { city: "Auckland", country: "New Zealand" },
    { city: "São Paulo", country: "Brazil" },
  ],
};
