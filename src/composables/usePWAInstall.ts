import { ref, onMounted, onUnmounted } from 'vue'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

const STORAGE_KEY = 'pwa-install-dismissed'
const INSTALL_DISMISSED_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds

export function usePWAInstall() {
  const installPrompt = ref<BeforeInstallPromptEvent | null>(null)
  const isInstallable = ref(false)
  const isInstalled = ref(false)
  const isDismissed = ref(true)

  const checkIfInstalled = () => {
    // Check if app is running in standalone mode (installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    if (isStandalone) {
      console.log('[PWA Install] App is already installed (standalone mode)')
      isInstalled.value = true
      return true
    }
    // Check for iOS Safari
    const nav = window.navigator as Navigator & { standalone?: boolean }
    if (nav.standalone === true) {
      console.log('[PWA Install] App is already installed (iOS standalone)')
      isInstalled.value = true
      return true
    }
    console.log('[PWA Install] App is not installed')
    return false
  }

  const checkDismissed = () => {
    if (typeof window === 'undefined' || !window.localStorage) {
      console.log('[PWA Install] localStorage not available')
      return false
    }
    const dismissedData = localStorage.getItem(STORAGE_KEY)
    if (!dismissedData) {
      console.log('[PWA Install] No dismissal record found')
      return false
    }
    try {
      const { timestamp } = JSON.parse(dismissedData)
      const now = Date.now()
      const timeSinceDismissal = now - timestamp
      // If dismissed more than 7 days ago, show again
      if (timeSinceDismissal > INSTALL_DISMISSED_DURATION) {
        console.log('[PWA Install] Dismissal expired, showing prompt again')
        localStorage.removeItem(STORAGE_KEY)
        return false
      }
      const daysRemaining = Math.ceil(
        (INSTALL_DISMISSED_DURATION - timeSinceDismissal) / (24 * 60 * 60 * 1000),
      )
      console.log(`[PWA Install] User dismissed prompt, will show again in ${daysRemaining} days`)
      return true
    } catch {
      console.log('[PWA Install] Error parsing dismissal data')
      return false
    }
  }

  const handleBeforeInstallPrompt = (e: Event) => {
    console.log('[PWA Install] beforeinstallprompt event fired!', e)
    // Prevent the default browser install prompt
    e.preventDefault()
    // Store the event for later use
    installPrompt.value = e as BeforeInstallPromptEvent
    isInstallable.value = true
    console.log('[PWA Install] Install prompt is now available')
  }

  const handleAppInstalled = () => {
    isInstalled.value = true
    isInstallable.value = false
    installPrompt.value = null
    // Clear dismissal state since app is now installed
    localStorage.removeItem(STORAGE_KEY)
  }

  const install = async () => {
    if (!installPrompt.value) {
      return false
    }

    try {
      // Show the install prompt
      await installPrompt.value.prompt()
      // Wait for user choice
      const choiceResult = await installPrompt.value.userChoice

      if (choiceResult.outcome === 'accepted') {
        isInstalled.value = true
        isInstallable.value = false
        installPrompt.value = null
        localStorage.removeItem(STORAGE_KEY)
        return true
      }
      return false
    } catch (error) {
      console.error('Error showing install prompt:', error)
      return false
    }
  }

  const dismiss = () => {
    isDismissed.value = true
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ timestamp: Date.now() }))
    }
  }

  const resetDismiss = () => {
    isDismissed.value = false
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(STORAGE_KEY)
    }
    console.log('[PWA Install] Dismissal reset, prompt can be shown again')
  }

  const shouldShowPrompt = (forceShow = false) => {
    if (isInstalled.value) {
      console.log('[PWA Install] Should not show: already installed')
      return false
    }
    if (isDismissed.value && !forceShow) {
      console.log('[PWA Install] Should not show: user dismissed')
      return false
    }
    // Allow showing even if event hasn't fired yet (for iOS or proactive display)
    // The install button will be disabled until the event fires
    console.log('[PWA Install] Should show prompt', { isInstallable: isInstallable.value })
    return true
  }

  const checkServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations()
        console.log('[PWA Install] Service Worker registrations:', registrations.length)
        if (registrations.length > 0) {
          registrations.forEach((reg, index) => {
            console.log(`[PWA Install] SW ${index}:`, {
              scope: reg.scope,
              active: reg.active?.state,
              installing: reg.installing?.state,
              waiting: reg.waiting?.state,
            })
          })
        } else {
          console.warn('[PWA Install] No service worker registered!')
        }
      } catch (error) {
        console.error('[PWA Install] Error checking service worker:', error)
      }
    } else {
      console.warn('[PWA Install] Service Workers not supported')
    }
  }

  const checkManifest = async () => {
    try {
      const manifestLink = document.querySelector('link[rel="manifest"]')
      if (manifestLink) {
        const manifestUrl = manifestLink.getAttribute('href')
        console.log('[PWA Install] Manifest link found:', manifestUrl)
        if (manifestUrl) {
          const response = await fetch(manifestUrl)
          const manifest = await response.json()
          console.log('[PWA Install] Manifest loaded:', manifest)

          // Check if icons exist
          if (manifest.icons) {
            for (const icon of manifest.icons) {
              try {
                const iconResponse = await fetch(icon.src)
                console.log(`[PWA Install] Icon ${icon.src}:`, iconResponse.ok ? 'OK' : 'NOT FOUND')
              } catch (error) {
                console.error(`[PWA Install] Icon ${icon.src} error:`, error)
              }
            }
          }
        }
      } else {
        console.warn('[PWA Install] No manifest link found in HTML')
      }
    } catch (error) {
      console.error('[PWA Install] Error checking manifest:', error)
    }
  }

  const checkBrowserSupport = () => {
    const support = {
      serviceWorker: 'serviceWorker' in navigator,
      beforeinstallprompt: 'onbeforeinstallprompt' in window,
      standalone: window.matchMedia('(display-mode: standalone)').matches,
      userAgent: navigator.userAgent,
      isSecureContext: window.isSecureContext,
      protocol: window.location.protocol,
    }
    console.log('[PWA Install] Browser support check:', support)

    // Warn about HTTP in production
    if (support.protocol === 'http:' && !window.location.hostname.includes('localhost')) {
      console.warn('[PWA Install] WARNING: PWA requires HTTPS in production!')
    }

    return support
  }

  onMounted(async () => {
    console.log('[PWA Install] Initializing PWA install detection...')
    // Check browser support
    checkBrowserSupport()

    // Check service worker
    await checkServiceWorker()

    // Check manifest
    await checkManifest()

    // Check if already installed
    if (checkIfInstalled()) {
      return
    }

    // Check if user previously dismissed
    if (checkDismissed()) {
      isDismissed.value = true
      console.log('[PWA Install] Prompt was dismissed, not showing')
      return
    } else {
      isDismissed.value = false
    }

    // Listen for the beforeinstallprompt event
    console.log('[PWA Install] Listening for beforeinstallprompt event...')
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Listen for app installed event
    window.addEventListener('appinstalled', handleAppInstalled)

    // Also check periodically in case the event fires later
    const checkInterval = setInterval(() => {
      if (isInstallable.value) {
        clearInterval(checkInterval)
        console.log('[PWA Install] Install prompt became available!')
      }
    }, 1000)

    // Clear interval after 10 seconds
    setTimeout(() => {
      clearInterval(checkInterval)
      if (!isInstallable.value) {
        console.warn('[PWA Install] Install prompt still not available after 10 seconds')
        console.log('[PWA Install] Possible reasons:')
        console.log('  - Browser engagement heuristics not met (need multiple visits/interactions)')
        console.log('  - Service worker not active')
        console.log('  - Manifest validation issues')
        console.log('  - Browser does not support PWA installation')
        console.log('')
        console.log('[PWA Install] To test install prompt:')
        console.log('  1. Visit the site multiple times (at least 2-3 times)')
        console.log('  2. Interact with the page (click buttons, navigate)')
        console.log('  3. Wait a few minutes between visits')
        console.log(
          '  4. Or enable Chrome flag: chrome://flags/#bypass-app-banner-engagement-checks',
        )
        console.log('')
        console.log('[PWA Install] Check DevTools → Application → Manifest for validation errors')
      }
    }, 10000)

    // Log current state for debugging
    console.log('[PWA Install] Current state:', {
      isInstallable: isInstallable.value,
      isInstalled: isInstalled.value,
      isDismissed: isDismissed.value,
      shouldShow: shouldShowPrompt(),
    })
  })

  onUnmounted(() => {
    window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.removeEventListener('appinstalled', handleAppInstalled)
  })

  return {
    installPrompt,
    isInstallable,
    isInstalled,
    isDismissed,
    install,
    dismiss,
    resetDismiss,
    shouldShowPrompt,
  }
}
