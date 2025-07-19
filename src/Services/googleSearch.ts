export type GoogleSearchResult = {
  title: string
  link: string
  image: {
    thumbnailLink: string
    contextLink: string
  }
}

export type GoogleSearchResponse = {
  items: GoogleSearchResult[]
  searchInformation: {
    totalResults: string
  }
  queries: {
    request: Array<{
      count: number
      startIndex: number
      totalResults: string
    }>
    nextPage?: Array<{
      count: number
      startIndex: number
      totalResults: string
    }>
  }
}

export const searchGoogle = async (query: string, startIndex: number = 1): Promise<GoogleSearchResponse> => {
  const response = await fetch(`https://customsearch.googleapis.com/customsearch/v1?key=${process.env.REACT_APP_GOOGLE_IMAGES_TOKEN}&searchType=image&q=${query}&cx=${process.env.REACT_APP_CUSTOMABLE_SEARCH_ENGINE_ID}&start=${startIndex}`)
  return response.json()
}