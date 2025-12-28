import { db } from './index'

export interface UserPreference {
  language?: string
  currency?: string
  notifications?: {
    email?: boolean
    push?: boolean
    sms?: boolean
  }
  searchFilters?: {
    defaultSort?: string
    defaultPriceRange?: [number, number]
  }
}

export interface SearchHistoryItem {
  query: string
  location?: string
  checkIn?: string
  checkOut?: string
  guests?: number
  timestamp: string
}

/**
 * Get user preferences
 */
export async function getUserPreferences(userId: string) {
  try {
    const prefs = await db.userPreferences.findUnique({
      where: { userId }
    })

    if (!prefs) {
      return {
        favorites: [],
        searchHistory: [],
        preferences: {}
      }
    }

    return {
      favorites: prefs.favorites ? JSON.parse(prefs.favorites) : [],
      searchHistory: prefs.searchHistory ? JSON.parse(prefs.searchHistory) : [],
      preferences: prefs.preferences ? JSON.parse(prefs.preferences) : {}
    }
  } catch (error) {
    console.error('Error getting user preferences:', error)
    throw error
  }
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(
  userId: string,
  preferences: UserPreference
) {
  try {
    const existing = await db.userPreferences.findUnique({
      where: { userId }
    })

    if (existing) {
      return await db.userPreferences.update({
        where: { userId },
        data: {
          preferences: JSON.stringify(preferences)
        }
      })
    } else {
      return await db.userPreferences.create({
        data: {
          userId,
          preferences: JSON.stringify(preferences)
        }
      })
    }
  } catch (error) {
    console.error('Error updating user preferences:', error)
    throw error
  }
}

/**
 * Add hotel to favorites
 */
export async function addToFavorites(userId: string, hotelId: string) {
  try {
    const prefs = await getUserPreferences(userId)
    const favorites = prefs.favorites as string[]

    if (favorites.includes(hotelId)) {
      return { success: false, message: 'Hotel already in favorites' }
    }

    favorites.push(hotelId)

    const existing = await db.userPreferences.findUnique({
      where: { userId }
    })

    if (existing) {
      await db.userPreferences.update({
        where: { userId },
        data: {
          favorites: JSON.stringify(favorites)
        }
      })
    } else {
      await db.userPreferences.create({
        data: {
          userId,
          favorites: JSON.stringify(favorites)
        }
      })
    }

    return { success: true, message: 'Added to favorites' }
  } catch (error) {
    console.error('Error adding to favorites:', error)
    throw error
  }
}

/**
 * Remove hotel from favorites
 */
export async function removeFromFavorites(userId: string, hotelId: string) {
  try {
    const prefs = await getUserPreferences(userId)
    const favorites = prefs.favorites as string[]

    const updatedFavorites = favorites.filter((id) => id !== hotelId)

    await db.userPreferences.update({
      where: { userId },
      data: {
        favorites: JSON.stringify(updatedFavorites)
      }
    })

    return { success: true, message: 'Removed from favorites' }
  } catch (error) {
    console.error('Error removing from favorites:', error)
    throw error
  }
}

/**
 * Get user's favorite hotels
 */
export async function getFavoriteHotels(userId: string) {
  try {
    const prefs = await getUserPreferences(userId)
    const favoriteIds = prefs.favorites as string[]

    if (favoriteIds.length === 0) {
      return []
    }

    const hotels = await db.hotel.findMany({
      where: {
        id: {
          in: favoriteIds
        }
      },
      include: {
        rooms: {
          take: 1,
          orderBy: {
            price: 'asc'
          }
        }
      }
    })

    return hotels
  } catch (error) {
    console.error('Error getting favorite hotels:', error)
    throw error
  }
}

/**
 * Check if hotel is in favorites
 */
export async function isHotelFavorited(userId: string, hotelId: string) {
  try {
    const prefs = await getUserPreferences(userId)
    const favorites = prefs.favorites as string[]

    return favorites.includes(hotelId)
  } catch (error) {
    console.error('Error checking favorite status:', error)
    return false
  }
}

/**
 * Add search to history
 */
export async function addSearchToHistory(
  userId: string,
  searchData: Omit<SearchHistoryItem, 'timestamp'>
) {
  try {
    const prefs = await getUserPreferences(userId)
    const searchHistory = (prefs.searchHistory as SearchHistoryItem[]) || []

    // Add timestamp
    const newSearch: SearchHistoryItem = {
      ...searchData,
      timestamp: new Date().toISOString()
    }

    // Keep only last 20 searches
    searchHistory.unshift(newSearch)
    const trimmedHistory = searchHistory.slice(0, 20)

    const existing = await db.userPreferences.findUnique({
      where: { userId }
    })

    if (existing) {
      await db.userPreferences.update({
        where: { userId },
        data: {
          searchHistory: JSON.stringify(trimmedHistory)
        }
      })
    } else {
      await db.userPreferences.create({
        data: {
          userId,
          searchHistory: JSON.stringify(trimmedHistory)
        }
      })
    }

    return { success: true }
  } catch (error) {
    console.error('Error adding search to history:', error)
    throw error
  }
}

/**
 * Get user's search history
 */
export async function getSearchHistory(userId: string, limit = 10) {
  try {
    const prefs = await getUserPreferences(userId)
    const searchHistory = (prefs.searchHistory as SearchHistoryItem[]) || []

    return searchHistory.slice(0, limit)
  } catch (error) {
    console.error('Error getting search history:', error)
    return []
  }
}

/**
 * Clear search history
 */
export async function clearSearchHistory(userId: string) {
  try {
    await db.userPreferences.update({
      where: { userId },
      data: {
        searchHistory: JSON.stringify([])
      }
    })

    return { success: true, message: 'Search history cleared' }
  } catch (error) {
    console.error('Error clearing search history:', error)
    throw error
  }
}
