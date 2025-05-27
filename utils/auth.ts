import axios, { AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';

export const api = axios.create({
  baseURL: 'http://192.168.15.8:3000',
  withCredentials: true, // necessário para lidar com cookies
});

export type UserDataRegister = {
    firstName: string;
    lastName: string;
    password: string;
    email: string;
    recordType: 'PATIENT'|'PARENT'
    parentEmail?:string
}


async function storeCookieFromResponse(response:AxiosResponse) {
  const setCookie = response.headers['set-cookie'] || response.headers['Set-Cookie'];

  if (setCookie && setCookie.length > 0) {
    console.log(setCookie)
    // Armazena o primeiro cookie
    await AsyncStorage.setItem('token', setCookie[0]);
  }
}

export async function registerUser(data:UserDataRegister) {
  try {
    let dataR:UserDataRegister
    if(data.recordType === 'PARENT' && !data.parentEmail){
        dataR = data;
        dataR.parentEmail = undefined
    }else{
        dataR = data
    }
    console.log(JSON.parse(JSON.stringify(dataR)))
    const response = await api.post('/auth/register', JSON.parse(JSON.stringify(dataR)));
    await storeCookieFromResponse(response);
    return response.data;
  } catch (error) {
    if(axios.isAxiosError(error))
        throw new Error(
            error.response?.data?.message || error.message || 'Registration failed'
        );
  }
}

type UserDataLogin = {
    email: string;
    password: string;
}


export async function loginUser(data:UserDataLogin,setToken?:(...any:any[])=>void) {
  try {
    const response = await api.post('/auth/login', data);
    await storeCookieFromResponse(response);
    return response.data;
  } catch (error) {
    if(axios.isAxiosError(error))
        throw new Error(
        error.response?.data?.message || error.message || 'Login failed'
        );
  }
}
// ... (suas outras funções como loginUser, registerUser, api)

export const logoutUser = async (
  navigation: NativeStackNavigationProp<RootStackParamList, any, undefined> // 'any' para o nome da rota atual
): Promise<void> => {
  try {
    await AsyncStorage.removeItem('token');
    // Opcional: limpar qualquer outro dado de usuário do AsyncStorage ou estado global
    // await AsyncStorage.removeItem('user_payload');

    // Redireciona para a tela de Login, substituindo a pilha de navegação
    // para que o usuário não possa voltar para as telas autenticadas.
    navigation.replace('Login');
  } catch (error) {
    console.error('Erro durante o logout:', error);
    // Você pode querer mostrar um alerta para o usuário aqui também
    // alert('Não foi possível fazer logout. Tente novamente.');
  }
};

// ... (resto do seu arquivo auth.ts)
