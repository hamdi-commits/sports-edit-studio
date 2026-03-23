import { create } from 'zustand'

const useAppStore = create((set) => ({
  // Athlete search
  athleteName: '',
  searchResults: [],
  selectedPhotos: [],

  // Effect & music
  selectedEffect: null,
  selectedMusic: null,

  // Render job
  jobId: null,
  jobStatus: null,   // 'pending' | 'active' | 'completed' | 'failed'
  jobProgress: 0,
  videoUrl: null,

  // Actions
  setAthleteName: (name) => set({ athleteName: name }),
  setSearchResults: (results) => set({ searchResults: results }),

  togglePhoto: (photo) =>
    set((state) => {
      const exists = state.selectedPhotos.find((p) => p.url === photo.url)
      if (exists) {
        return { selectedPhotos: state.selectedPhotos.filter((p) => p.url !== photo.url) }
      }
      if (state.selectedPhotos.length >= 10) return state
      return { selectedPhotos: [...state.selectedPhotos, photo] }
    }),

  setSelectedEffect: (effect) => set({ selectedEffect: effect }),
  setSelectedMusic: (music) => set({ selectedMusic: music }),

  setJobId: (jobId) => set({ jobId }),
  setJobStatus: (status) => set({ jobStatus: status }),
  setJobProgress: (progress) => set({ jobProgress: progress }),
  setVideoUrl: (url) => set({ videoUrl: url }),

  reset: () =>
    set({
      athleteName: '',
      searchResults: [],
      selectedPhotos: [],
      selectedEffect: null,
      selectedMusic: null,
      jobId: null,
      jobStatus: null,
      jobProgress: 0,
      videoUrl: null,
    }),
}))

export default useAppStore
