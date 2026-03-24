import { create } from 'zustand'

const useAppStore = create((set) => ({
  // Athlete
  athleteName: '',
  searchResults: [],

  // Photo count target
  photoCount: 5,

  // Selected photos
  selectedPhotos: [],

  // Per-photo effect & duration  { [url]: effectId | durationSec }
  photoEffects: {},
  photoDurations: {},

  // Music
  selectedMusic: null,

  // Render job
  jobId: null,
  jobStatus: null,
  jobProgress: 0,
  videoUrl: null,

  // Actions
  setAthleteName: (name) => set({ athleteName: name }),
  setSearchResults: (results) => set({ searchResults: results }),
  setPhotoCount: (count) => set({ photoCount: count }),

  togglePhoto: (photo) =>
    set((state) => {
      const exists = state.selectedPhotos.find((p) => p.url === photo.url)
      if (exists) {
        const effects = { ...state.photoEffects }
        const durations = { ...state.photoDurations }
        delete effects[photo.url]
        delete durations[photo.url]
        return {
          selectedPhotos: state.selectedPhotos.filter((p) => p.url !== photo.url),
          photoEffects: effects,
          photoDurations: durations,
        }
      }
      if (state.selectedPhotos.length >= state.photoCount) return state
      return {
        selectedPhotos: [...state.selectedPhotos, photo],
        photoEffects: { ...state.photoEffects, [photo.url]: 'ken_burns' },
        photoDurations: { ...state.photoDurations, [photo.url]: 2.5 },
      }
    }),

  setPhotoEffect: (url, effectId) =>
    set((state) => ({ photoEffects: { ...state.photoEffects, [url]: effectId } })),

  setPhotoDuration: (url, duration) =>
    set((state) => ({ photoDurations: { ...state.photoDurations, [url]: duration } })),

  setSelectedMusic: (music) => set({ selectedMusic: music }),

  setJobId: (jobId) => set({ jobId }),
  setJobStatus: (status) => set({ jobStatus: status }),
  setJobProgress: (progress) => set({ jobProgress: progress }),
  setVideoUrl: (url) => set({ videoUrl: url }),

  reset: () =>
    set({
      athleteName: '',
      searchResults: [],
      photoCount: 5,
      selectedPhotos: [],
      photoEffects: {},
      photoDurations: {},
      selectedMusic: null,
      jobId: null,
      jobStatus: null,
      jobProgress: 0,
      videoUrl: null,
    }),
}))

export default useAppStore
