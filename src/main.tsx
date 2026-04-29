import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { AxiosError } from 'axios'
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import {
  DirectionProvider,
  FontProvider,
  LayoutProvider,
  SearchProvider,
} from '@asteby/metacore-app-providers'
import { useAuthStore } from '@asteby/metacore-auth'
import { ThemeProvider } from '@asteby/metacore-theme'
import { fonts } from '@asteby/metacore-theme/fonts'
import { toast } from 'sonner'
// I18n
import './i18n/i18n'
// Generated Routes
import { routeTree } from './routeTree.gen'
// Styles
import './styles/index.css'

function handleServerError(error: unknown) {
  // eslint-disable-next-line no-console
  console.log(error)
  let errMsg = 'Something went wrong!'
  if (
    error &&
    typeof error === 'object' &&
    'status' in error &&
    Number(error.status) === 204
  ) {
    errMsg = 'Content not found.'
  }
  if (error instanceof AxiosError) {
    errMsg =
      error.response?.data?.message ||
      error.response?.data?.title ||
      error.message
  }
  toast.error(errMsg)
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (failureCount > 3 && import.meta.env.PROD) return false
        return !(
          error instanceof AxiosError &&
          [401, 403].includes(error.response?.status ?? 0)
        )
      },
      refetchOnWindowFocus: import.meta.env.PROD,
      staleTime: 10 * 1000,
    },
    mutations: {
      onError: (error) => {
        handleServerError(error)
        if (error instanceof AxiosError && error.response?.status === 304) {
          toast.error('Content not modified!')
        }
      },
    },
  },
  queryCache: new QueryCache({
    onError: (error) => {
      if (error instanceof AxiosError) {
        if (error.response?.status === 401) {
          toast.error('Session expired!')
          useAuthStore.getState().auth.reset()
          const redirect = `${router.history.location.href}`
          router.navigate({ to: '/sign-in', search: { redirect } })
        }
        if (error.response?.status === 500) {
          toast.error('Internal Server Error!')
          if (import.meta.env.PROD) router.navigate({ to: '/500' })
        }
      }
    },
  }),
})

// Create a new router instance
const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
  scrollRestoration: true,
})

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// Render the app
const rootElement = document.getElementById('root')!
const root = ReactDOM.createRoot(rootElement)
root.render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <FontProvider fonts={fonts}>
          <DirectionProvider>
            <LayoutProvider>
              <SearchProvider>
                <RouterProvider router={router} />
              </SearchProvider>
            </LayoutProvider>
          </DirectionProvider>
        </FontProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>
)
