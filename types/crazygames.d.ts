
export interface CrazyGamesSDK {
    init: () => Promise<void>
    game: {
        gameplayStart: () => void
        gameplayStop: () => void
        loadingStart: () => void
        loadingStop: () => void
    }
    ad: {
        requestAd: (type: 'midgame' | 'rewarded', callbacks?: {
            adStarted?: () => void
            adFinished?: () => void
            adError?: (error: any) => void
        }) => void
    }
    user: {
        isUserAccountAvailable: boolean
        getUser: () => Promise<any>
        systemInfo: {
            countryCode: string
            browser: {
                name: string
                version: string
            }
            os: {
                name: string
                version: string
            }
            device: {
                type: string
            }
        }
    }
    data: {
        setItem: (key: string, value: any) => void
        getItem: (key: string) => any
    }
}

declare global {
    interface Window {
        CrazyGames: {
            SDK: CrazyGamesSDK
        }
    }
}
