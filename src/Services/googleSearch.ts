type GoogleSearchResult = {
  title: string
  link: string
  image: {
    thumbnailLink: string
    contextLink: string
  }
}

export const searchGoogle = async (query: string): Promise<GoogleSearchResult[]> => {
  return fetch(`https://customsearch.googleapis.com/customsearch/v1?key=${process.env.REACT_APP_GOOGLE_IMAGES_TOKEN}&searchType=image&q=${query}&cx=${process.env.REACT_APP_CUSTOMABLE_SEARCH_ENGINE_ID}`)
    .then(res => res.json())
    .then(res => res.items)
}