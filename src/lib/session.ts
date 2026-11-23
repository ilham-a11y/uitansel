// Sesi disimpan di localStorage. Nilainya adalah id akun yang sedang masuk.
const TOKEN_KEY = 'tumbuhruang-token'

export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (token: string | null) => {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}
