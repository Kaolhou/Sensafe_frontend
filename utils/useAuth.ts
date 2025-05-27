import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Navigation-related imports are removed as the hook will no longer handle navigation directly.
// import { NavigationProp, useNavigation } from '@react-navigation/native';
import jwt_decode from './jwt_decoder';

// This type might be defined elsewhere if needed by other parts of your app,
// but useAuth itself doesn't need to define or use AppStackParamList if it's not navigating.
// export type AppStackParamList = { Login: undefined; };

type RecordType = "PATIENT" | "PARENT";

export interface SessionEmail {
  id: string;
  email: string;
  recordType: RecordType;
  sessionId: string;
  expiresAt: string; // ISO string format
}
export interface SessionPayload {
  email: SessionEmail;
  iat: number; // Issued At - Unix timestamp
  exp: number; // Expiration - Unix timestamp
}


export function useAuth() {
  const [token, setToken] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [payload, setPayload] = useState<SessionPayload | undefined>(undefined);

  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      // console.log('[useAuth.ts] checkAuth - Iniciando verificação de autenticação.'); // LOG 3
      try {
        const storedToken = await AsyncStorage.getItem('token'); // Certifique-se que a chave é 'token'
        // console.log('[useAuth.ts] checkAuth - Token lido do AsyncStorage:', storedToken); // LOG 4

        if (storedToken) {
          setToken(storedToken);
          try {
            const decodedPayload = jwt_decode<SessionPayload>(storedToken);
            // console.log('[useAuth.ts] checkAuth - Payload decodificado:', decodedPayload); // LOG 5
            setPayload(decodedPayload);
          } catch (decodeError) {
            // console.error('[useAuth.ts] checkAuth - Erro ao decodificar token:', decodeError);
            await AsyncStorage.removeItem('token');
            setToken(undefined);
            setPayload(undefined);
          }
        } else {
          // console.log('[useAuth.ts] checkAuth - Nenhum token encontrado no AsyncStorage.'); // LOG 6
          setToken(undefined);
          setPayload(undefined);
        }
      } catch (error) {
        console.error('[useAuth.ts] checkAuth - Erro ao verificar autenticação no AsyncStorage:', error);
        setToken(undefined);
        setPayload(undefined);
      } finally {
        setIsLoading(false);
        // console.log('[useAuth.ts] checkAuth - Verificação de autenticação finalizada. isLoading:', false); // LOG 7
      }
    };

    checkAuth();
  }, []); // Executa uma vez na montagem

  // Opcional: Log para quando o payload interno do useAuth realmente muda
  useEffect(() => {
    console.log('[useAuth.ts] Estado interno - payload mudou para:', payload); // LOG 8
  }, [payload]);


  return { token, isLoading, payload };
}