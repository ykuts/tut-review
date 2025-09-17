import { LogLevel } from '@azure/msal-browser';

/**
 * Determine the current environment and set appropriate redirect URI
 */
const getEnvironmentConfig = () => {
    const hostname = window.location.hostname;
    const port = window.location.port;
    const protocol = window.location.protocol;
    // Production environment (Azure Static Web Apps)
    if (hostname.includes('azurestaticapps.net')) {
        return {
            REDIRECT_URI: "https://mango-smoke-0ae83910f.6.azurestaticapps.net",
            environment: 'production'
        };
    }
    // Development environment (localhost with any port)
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        const currentUrl = `${protocol}//${hostname}${port ? `:${port}` : ''}`;
        return {
            REDIRECT_URI: currentUrl,
            environment: 'development'
        };
    }
    // Staging environment  
    if (hostname.includes('staging-aitut.iverse.space')) {
        return {
            REDIRECT_URI: "https://staging-aitut.iverse.space",
            environment: 'staging'
        };
    }
    // Other environments (fallback)
    return {
        REDIRECT_URI: `${protocol}//${hostname}${port ? `:${port}` : ''}`,
        environment: 'other'
    };
};

const envConfig = getEnvironmentConfig();

const config = {
    MICROSOFT_CLIENT_ID: MICROSOFT_CLIENT_ID,
    GOOGLE_CLIENT_ID: GOOGLE_CLIENT_ID,
    REDIRECT_URI: envConfig.REDIRECT_URI,
    ENVIRONMENT: envConfig.environment
};

// Log current configuration for debugging
console.log(`🔧 [Auth Config] Environment: ${config.ENVIRONMENT}`);
console.log(`🔧 [Auth Config] Redirect URI: ${config.REDIRECT_URI}`);

/**
 * 🔵 MICROSOFT MSAL Configuration
 */
export const msalConfig = {
    auth: {
        clientId: config.MICROSOFT_CLIENT_ID,
        authority: "https://login.microsoftonline.com/consumers",
        redirectUri: config.REDIRECT_URI,
        postLogoutRedirectUri: config.REDIRECT_URI,
        navigateToLoginRequestUrl: false,
    },
    cache: {
        cacheLocation: "sessionStorage",
        storeAuthStateInCookie: false,
    },
    system: {
        loggerOptions: {
            loggerCallback: (level, message, containsPii) => {
                if (containsPii) return;

                // Only log errors and warnings, suppress info
                switch (level) {
                    case LogLevel.Error:
                        console.error('🔴 [MSAL Error]:', message);
                        break;
                    case LogLevel.Info:
                        console.info('🔵 [MSAL Info]:', message);
                        break;
                    case LogLevel.Warning:
                        console.warn('🟠 [MSAL Warning]:', message);
                        break;
                    case LogLevel.Verbose:
                    default:
                        console.log('🔗 [MSAL]:', message);
                        break;
                }
            },
            logLevel: LogLevel.Info,
        },
    },
};

export const loginRequest = {
    scopes: ["User.Read"]
};

export const googleConfig = {
    clientId: config.GOOGLE_CLIENT_ID,
    redirectUri: config.REDIRECT_URI
};

// Export environment info for use in other components
export const environmentInfo = {
    environment: config.ENVIRONMENT,
    redirectUri: config.REDIRECT_URI,
    isDevelopment: config.ENVIRONMENT === 'development',
    isProduction: config.ENVIRONMENT === 'production',
    isStaging: config.ENVIRONMENT === 'staging'
};
