import React,{useEffect, useState} from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator, NativeStackScreenProps } from '@react-navigation/native-stack';
import {View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,Dimensions, Platform, Alert} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';// Biblioteca de ícones
import {registerUser,loginUser, UserDataRegister, api, logoutUser} from './utils/auth'
import MapView, { Marker, } from 'react-native-maps';
import {useAuth} from './utils/useAuth'
import axios from 'axios';
import * as Device from 'expo-device';
import * as Location from 'expo-location';
import * as Application from 'expo-application';
import * as Linking from 'expo-linking';


export type RootStackParamList = {
  Login: undefined;
  Registro: undefined;
  SelecionarUsuario: undefined;
  Menu: { patientId: string };
  ConfigurarDispositivo: undefined;
  VerLocalizacao: { patientId: string };
  Patient:undefined;
};

interface GeolocationData {
  latitude: number;
  longitude: number;
  timestamp?: string; // Opcional, mas bom ter
}


const Stack = createNativeStackNavigator<RootStackParamList>();

type LoginScreenProps = NativeStackScreenProps<RootStackParamList, 'Login'>;
type RegistroScreenProps = NativeStackScreenProps<RootStackParamList, 'Registro'>;
type SelecionarUsuarioScreenProps = NativeStackScreenProps<RootStackParamList, 'SelecionarUsuario'>;
type MenuScreenProps = NativeStackScreenProps<RootStackParamList, 'Menu'>;
type PatientScreenProps = NativeStackScreenProps<RootStackParamList, 'Patient'>;
type VerLocalizacaoScreenProps = NativeStackScreenProps<RootStackParamList, 'VerLocalizacao'>; // Props para VerLocalizacaoScreen

const Logo: React.FC = () => <Text style={styles.logo}>SenseSafe</Text>;

const VerLocalizacaoScreen: React.FC<VerLocalizacaoScreenProps> = ({ route }) => {
  const { patientId } = route.params;
  const [location, setLocation] = useState<GeolocationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLatestLocation = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // console.log(`Buscando localização para patientId: ${patientId}`);
        const response = await api.get<GeolocationData>(`/location/latest/${patientId}`);
        // console.log('API Response:', response.data);
        setLocation(response.data);
      } catch (err) {
        console.error('Erro ao buscar localização:', err);
        setError(axios.isAxiosError(err) && err.response?.data?.message ? err.response.data.message : 'Não foi possível carregar a localização.');
      } finally {
        setIsLoading(false);
      }
    };

    if (patientId) {
      fetchLatestLocation();
    }
  }, [patientId]);

  if (isLoading) {
    return <View style={styles.container}><Logo /><Text>Carregando localização...</Text></View>;
  }

  if (error) {
    return <View style={styles.container}><Logo /><Text style={styles.errorText}>Erro: {error}</Text></View>;
  }

  if (!location) {
    return <View style={styles.container}><Logo /><Text>Nenhuma localização encontrada para este paciente.</Text></View>;
  }

  return (
    <View style={styles.container}>
      <Logo />
      <Text style={styles.text}>Localização em Tempo Real (Paciente ID: {patientId})</Text>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        <Marker
          coordinate={{ latitude: location.latitude, longitude: location.longitude }}
          title="Localização Atual"
          description={`Lat: ${location.latitude.toFixed(4)}, Lon: ${location.longitude.toFixed(4)}`}
        />
      </MapView>

  </View>
);
}
interface LoginData {
  email: string;
  password: string;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const {payload, isLoading} = useAuth()
  const [loginData, setLoginData] = useState<LoginData>({
    email: '',
    password: '',
  });

  useEffect(() => {
    // Este efeito lida com o efeito colateral de navegação.
    // Ele deve ser reexecutado se isLoading, payload ou navigation mudarem.
    if (!isLoading && payload?.email.recordType === 'PARENT') {
      console.log("LoginScreen: Tentando navegar para SelecionarUsuario");
      navigation.replace('SelecionarUsuario');
    }
    if (!isLoading && payload?.email.recordType === 'PATIENT') {
      console.log("LoginScreen: Tentando navegar para PatientScreen");
      navigation.replace('SelecionarUsuario');
    }
  }, [isLoading, payload, navigation]); // Dependências corrigidas

  if (isLoading) {
    // Estado de carregamento primário: enquanto a autenticação está sendo verificada.
    console.log("LoginScreen: isLoading é true, renderizando indicador de carregamento.");
    return (
      <View style={styles.container}>
        <Logo />
        <Text>Verificando autenticação...</Text>
      </View>
    );
  }

  // Se isLoading for false, mas estamos prestes a navegar (ou deveríamos ter navegado)
  // Isso evita que o formulário de login pisque se a navegação for iminente.
  if (payload?.email.recordType === 'PARENT') {
    // O useEffect acima deve lidar com a navegação.
    // Renderizamos um placeholder ou null enquanto isso acontece.
    console.log("LoginScreen: Payload indica PARENT, deveria estar navegando. Renderizando mensagem de redirecionamento.");
    return (
      <View style={styles.container}>
        <Logo />
        <Text>Redirecionando...</Text>
      </View>
    );
  }

  const handleChange = (field: keyof LoginData, value: string) => {
    setLoginData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogin = async () => {
    try {
      // Chama a função loginUser com o email e senha do estado
      await loginUser( {
        email: loginData.email,
        password: loginData.password,
      });
      // Se login for sucesso, navega para a tela 'SelecionarUsuario'
      navigation.replace('SelecionarUsuario');
    } catch (error) {
      // Trate erro de login aqui (exibir mensagem, etc)
      console.error('Erro no login:', error);
      alert('Falha no login. Verifique email e senha.');
    }
  };

  // Se não estiver carregando e não for um PARENT a ser redirecionado, renderize o formulário de login.
  console.log("LoginScreen: Renderizando formulário de login.");
  return (
    <View style={styles.container}>
      <Logo />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={loginData.email}
        onChangeText={text => handleChange('email', text)}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Senha"
        secureTextEntry
        value={loginData.password}
        onChangeText={text => handleChange('password', text)}
      />
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Entrar</Text>
      </TouchableOpacity>
      <Text style={styles.noAccountText}>Não possui conta?</Text>
      <TouchableOpacity onPress={() => navigation.navigate('Registro')}>
        <Text style={styles.link}>Criar conta</Text>
      </TouchableOpacity>
    </View>
  );
};

type RecordTypeValue = 'PATIENT' | 'PARENT' | '';

interface RecordTypeSelectorProps {
  value: RecordTypeValue;
  onChange: (value: 'PATIENT' | 'PARENT') => void;
}

type ParentData = {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
}
const PatientScreen: React.FC<PatientScreenProps> = ({ navigation }) => {
  const [parentData,setParentData] = useState<ParentData[]>([]);
  const {payload,isLoading,token} = useAuth();
  const [serial,setSerial] = useState('')

  useEffect(() => {
    let locationInterval: NodeJS.Timeout | undefined = undefined;

    const requestLocationAndLog = async () => {
      // 1. Solicitar permissão de localização
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          "Permissão Necessária",
          "Para o monitoramento de localização, precisamos da sua permissão. Por favor, habilite nas configurações do aplicativo."
        );
        return;
      }

      // 2. Função para obter e logar a localização
      const logCurrentLocation = async () => {
        try {
          let location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          // console.debug(serial)
          if(!serial) return 
          const {status} = await api.post('/location',{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            serialNumber: serial,
          })
          console.log(status)
        } catch (error) {
          if(axios.isAxiosError(error)){
            console.log(error.request)
          }
          console.error("Erro ao obter localização (Paciente):", error);
          // Opcional: Alertar o usuário sobre a falha na obtenção da localização
          // Alert.alert("Erro de Localização", "Não foi possível obter a localização atual.");
        }
      };

      // 3. Logar a localização imediatamente uma vez
      await logCurrentLocation()

      // 4. Configurar intervalo para logar a localização a cada 1 minuto
      locationInterval = setInterval(logCurrentLocation, 60000); // 60000 ms = 1 minuto
    };

    requestLocationAndLog();
    const getDeviceSerial = async () => {
      let uniqueIdStr = '';

      try {
        // Obter ID único do dispositivo (substituto para serial number)
        if (Platform.OS === 'android') {
          uniqueIdStr = Application.getAndroidId() || 'unknown_android_id';
        } else if (Platform.OS === 'ios') {
          const iosId = await Application.getIosIdForVendorAsync();
          uniqueIdStr = iosId || 'unknown_ios_id';
        } else {
          uniqueIdStr = 'unknown_platform_id';
        }
        setSerial(uniqueIdStr)
      }catch(error){
        console.error(error)
      }
    }
    getDeviceSerial()


    // console.log(payload?.email.id, !isLoading)
    if (payload?.email.id && !isLoading) {
      api.get<ParentData[]>(`/r/patient/${payload?.email.id}/parents`)
      .then((response) => {
        console.log('Patient data:', response.data);
        setParentData(response.data);
      })
      .catch((error) => {
        console.error('Error fetching parent data:', error.isAxiosError ? error.message : error);
        // Considerar mostrar um feedback ao usuário sobre o erro
      });
    }


    // 5. Limpar o intervalo quando o componente for desmontado
    return () => {
      if (locationInterval) {
        clearInterval(locationInterval);
      }
    };
  }, [isLoading]); // Array de dependências vazio para executar apenas na montagem e desmontagem
  if(!isLoading && payload?.email.recordType !== 'PATIENT'){
    navigation.replace('Login')
    return null;
  }
  const handleEmergencyCall = () => {
    Linking.openURL(`tel:${parentData[0].phoneNumber.replace(' ', '').replace('-', '')}`);
  };

  return (
    <View style={styles.patientScreenContainer}>
      <TouchableOpacity
        style={styles.patientScreenEmergencyButton}
        onPress={handleEmergencyCall}
      >
        <Icon name="exclamation-triangle" size={70} color="white" />
        <Text style={styles.patientScreenEmergencyButtonText}>EMERGÊNCIA</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.logoutButtonPatient} onPress={() => logoutUser(navigation)}>
        <Text style={styles.logoutButtonTextPatient}>Sair</Text>
      </TouchableOpacity>
    </View>
  );
};

const RecordTypeSelector: React.FC<RecordTypeSelectorProps> = ({ value, onChange }) => {
  return (
    <View style={styles.selectorContainer}>
      <TouchableOpacity
        style={[styles.option, value === 'PATIENT' && styles.selectedOption]}
        onPress={() => onChange('PATIENT')}
      >
        <Text style={styles.optionText}>Paciente</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.option, value === 'PARENT' && styles.selectedOption]}
        onPress={() => onChange('PARENT')}
      >
        <Text style={styles.optionText}>Parente</Text>
      </TouchableOpacity>
    </View>
  );
};

// Interface para o estado do formulário de Registro, estendendo UserDataRegister
interface RegistrationFormData extends UserDataRegister {
  serialNumber?: string;
  deviceName?: string;
  phoneNumber?:string;
  latitude?: string; // Mantido como string para o input/display, será convertido para número no envio
  longitude?: string; // Mantido como string para o input/display, será convertido para número no envio
}

const RegistroScreen: React.FC<RegistroScreenProps> = ({ navigation }) => {
  const [registerData, setRegisterData] = useState<RegistrationFormData>({
    firstName: '',
    lastName: '',
    recordType: 'PATIENT', // só pode ser 'PATIENT' ou 'PARENT'
    password: '',
    email: '',
    parentEmail: '',
    serialNumber: '',
    deviceName: '',
    latitude: '',
    longitude: '',
  });
  const [isFetchingDeviceInfo, setIsFetchingDeviceInfo] = useState(false);

  useEffect(() => {
    const fetchPatientSpecificInfo = async () => {
      if (registerData.recordType === 'PATIENT') {
        setIsFetchingDeviceInfo(true);
        let deviceNameStr = Device.deviceName || 'Dispositivo Desconhecido';
        let uniqueIdStr = '';

        try {
          // Obter ID único do dispositivo (substituto para serial number)
          if (Platform.OS === 'android') {
            uniqueIdStr = Application.getAndroidId() || 'unknown_android_id';
          } else if (Platform.OS === 'ios') {
            const iosId = await Application.getIosIdForVendorAsync();
            uniqueIdStr = iosId || 'unknown_ios_id';
          } else {
            uniqueIdStr = 'unknown_platform_id';
          }

          // Solicitar permissão de localização
          let { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert(
              "Permissão Necessária",
              "Para registrar como paciente, precisamos da sua permissão de localização. Por favor, habilite nas configurações do aplicativo."
            );
            setRegisterData(prev => ({
              ...prev,
              deviceName: deviceNameStr,
              serialNumber: uniqueIdStr,
              latitude: '',
              longitude: '',
            }));
            setIsFetchingDeviceInfo(false);
            return;
          }

          // Obter localização atual
          let location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High, // Você pode ajustar a precisão
          });

          setRegisterData(prev => ({
            ...prev,
            deviceName: deviceNameStr,
            serialNumber: uniqueIdStr,
            latitude: location.coords.latitude.toString(),
            longitude: location.coords.longitude.toString(),
          }));

        } catch (err) {
          console.error("Erro ao buscar informações do paciente:", err);
          Alert.alert("Erro", "Não foi possível obter informações do dispositivo ou localização. Verifique as permissões.");
          // Define nome e serial mesmo se a localização falhar
          setRegisterData(prev => ({
            ...prev,
            deviceName: deviceNameStr,
            serialNumber: uniqueIdStr, // Pode já ter sido obtido
            latitude: '',
            longitude: '',
          }));
        } finally {
          setIsFetchingDeviceInfo(false);
        }
      } else {
        // Se o tipo de registro não for PACIENTE, limpa os campos e para de buscar
        setRegisterData(prev => ({
          ...prev, deviceName: '', serialNumber: '', latitude: '', longitude: '',
        }));
        setIsFetchingDeviceInfo(false);
      }
    };

    fetchPatientSpecificInfo();
  }, [registerData.recordType]); // Re-executa quando o tipo de registro muda

  const handleRegister = async () => {
    try{
      if (!registerData.recordType || (registerData.recordType !== 'PATIENT' && registerData.recordType !== 'PARENT')) {
        alert("Por favor, selecione o tipo de registro (Paciente ou Parente).");
        return;
      }

      // Cria uma cópia do estado para montar o payload da API.
      // Usamos 'any' por flexibilidade, mas idealmente UserDataRegister cobriria todos os campos.
      const apiPayload: any = { ...registerData };

      if (registerData.recordType === 'PATIENT') {
        // 1. Verificar se as informações do dispositivo ainda estão sendo buscadas.
        if (isFetchingDeviceInfo) {
          alert("Aguarde, as informações do dispositivo e localização ainda estão sendo obtidas.");
          return;
        }

        // 2. Validar e-mail do parente.
        if (!registerData.parentEmail) {
          alert("Para pacientes, o Email do Parente é obrigatório.");
          return;
        }
        if (!apiPayload.serialNumber || !apiPayload.deviceName || !apiPayload.latitude || !apiPayload.longitude) {
          alert("Informações do dispositivo (Serial, Nome, Localização) são obrigatórias para pacientes e não foram encontradas. Verifique as permissões do aplicativo e tente novamente.");
          return;
        }

        // 4. Converter coordenadas para número e validar.
        const latNum = parseFloat(apiPayload.latitude as string);
        const lonNum = parseFloat(apiPayload.longitude as string);

        if (isNaN(latNum) || isNaN(lonNum)) {
          alert("Os valores de latitude ou longitude obtidos são inválidos. Tente registrar novamente.");
          return;
        }
        // Assume-se que a API espera números para latitude e longitude.
        apiPayload.latitude = latNum;
        apiPayload.longitude = lonNum;
      }
      // Para 'PARENT', os campos de dispositivo (serialNumber, etc.) estarão vazios ou ausentes no apiPayload
      // se não fizerem parte da estrutura inicial de registerData para PARENT,
      // ou serão enviados como strings vazias se estiverem. A API deve ignorá-los para PARENT.
      else if (registerData.recordType === 'PARENT') {
        // Validação específica para PARENT, como o número de telefone
        if (!registerData.phoneNumber) {
          alert("Para parentes, o Número de Telefone é obrigatório.");
          return;
        }
        // Não precisa remover campos de dispositivo, pois eles não serão preenchidos
        // ou a API deve ignorá-los para o tipo PARENT.
        // Se a API for rigorosa, você pode querer limpar explicitamente os campos de dispositivo aqui:
        // delete apiPayload.serialNumber;
        // delete apiPayload.deviceName;
        // delete apiPayload.latitude;
        // delete apiPayload.longitude;
        // delete apiPayload.parentEmail; // parentEmail não faz sentido para um PARENT
      }
      await registerUser(apiPayload as UserDataRegister); // Faz o cast para o tipo esperado pela função.
      navigation.replace('SelecionarUsuario');
    }catch(err){
      console.error('Erro no registro:', err);
      let alertMessage = 'Falha no registro. Verifique os dados e tente novamente.';

      if (axios.isAxiosError(err) && err.response && err.response.data) {
        const errorData = err.response.data;
        // Se o backend retornar um objeto com mensagens de erro por campo (como no exemplo anterior)
        if (typeof errorData === 'object' && errorData !== null) {
          const fieldErrors: string[] = Object.entries(errorData)
            .map(([key, value]) => Array.isArray(value) ? `${key}: ${value.join(', ')}` : `${key}: ${value}`);
          if (fieldErrors.length > 0) {
            alertMessage = `Falha no registro:\n${fieldErrors.join('\n')}`;
          } else if (errorData.message && typeof errorData.message === 'string') { // Caso genérico de erro
            alertMessage = `Falha no registro: ${errorData.message}`;
          }
        } else if (typeof errorData === 'string') { // Se o erro for uma string simples
            alertMessage = `Falha no registro: ${errorData}`;
        }
      } else if (err instanceof Error) {
        alertMessage = `Falha no registro: ${err.message}`;
      }
      alert(alertMessage);
    }
  };

  const handleChange = <K extends keyof RegistrationFormData>(field: K, value: RegistrationFormData[K]) => {
    setRegisterData(prevData => ({
      ...prevData,
      [field]: value
    }));
  };

  return (
    <View style={styles.container}>
      <Logo />
      <TextInput
        style={styles.input}
        placeholder="Nome"
        value={registerData.firstName}
        onChangeText={text => handleChange('firstName', text)}
      />
      <TextInput
        style={styles.input}
        placeholder="Sobrenome"
        value={registerData.lastName}
        onChangeText={text => handleChange('lastName', text)}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={registerData.email}
        onChangeText={text => handleChange('email', text)}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      {/* Selector para recordType */}
      <RecordTypeSelector
        value={registerData.recordType}
        onChange={val => handleChange('recordType', val)}
      />

      <TextInput
        style={styles.input}
        placeholder="Senha"
        value={registerData.password}
        onChangeText={text => handleChange('password', text)}
        secureTextEntry
      />
      {
        registerData.recordType === 'PATIENT' && (
          <TextInput
            style={styles.input}
            placeholder="Email do Parente"
            value={registerData.parentEmail}
            onChangeText={text => handleChange('parentEmail', text)}
            keyboardType='email-address'
          />
        )
      }
      {
        registerData.recordType === 'PARENT' && (
          <TextInput
            style={styles.input}
            placeholder="Número de Telefone"
            value={registerData.phoneNumber}
            onChangeText={text => handleChange('phoneNumber', text)}
            keyboardType='phone-pad'
          />
        )
      }
      {/* Campos de dispositivo e localização para PACIENTE (preenchidos automaticamente) */}
      {/* {registerData.recordType === 'PATIENT' && (
        <>
          {isFetchingDeviceInfo && <Text style={styles.loadingText}>Obtendo informações do dispositivo e localização...</Text>}
          {!isFetchingDeviceInfo && registerData.deviceName && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nome do Dispositivo:</Text>
              <Text style={styles.infoValue}>{registerData.deviceName}</Text>
            </View>
          )}
          {!isFetchingDeviceInfo && registerData.serialNumber && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>ID Único (Serial):</Text>
              <Text style={styles.infoValue}>{registerData.serialNumber}</Text>
            </View>
          )}
          {!isFetchingDeviceInfo && registerData.latitude && registerData.longitude && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Coordenadas Atuais:</Text>
              <Text style={styles.infoValue}>Lat: {parseFloat(registerData.latitude).toFixed(4)}, Lon: {parseFloat(registerData.longitude).toFixed(4)}</Text>
            </View>
          )}
        </>
      )} */}
      <TouchableOpacity
        style={styles.button}
        onPress={handleRegister}
      >
        <Text style={styles.buttonText}>Registrar</Text>
      </TouchableOpacity>
    </View>
  );
};

type Patient = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

const SelecionarUsuarioScreen: React.FC<SelecionarUsuarioScreenProps> = ({ navigation }) => {
  const {isLoading,token,payload} = useAuth();
  const [patients,setPatients] = useState<Patient[]>([])

  useEffect(() => {
    const parentEmailId = payload?.email?.id;
    // console.log(parentEmailId,isLoading,parentEmailId && !isLoading)
    if(payload?.email.recordType === 'PATIENT') navigation.replace('Patient');
    if (parentEmailId && !isLoading) {
      api.get(`/r/parent/${parentEmailId}/patients`)
        .then((response) => {
          console.log('Parent data:', response.data);
          setPatients(response.data);
          // Aqui você pode querer armazenar os dados do parente em um estado
          // para exibir informações relevantes na tela, como a lista de pacientes associados.
        })
        .catch((error) => {
          console.error('Error fetching parent data:', error.isAxiosError ? error.message : error);
          // Considerar mostrar um feedback ao usuário sobre o erro
        });
    }
  }, [payload, isLoading]); // Adicionado isLoading como dependência

  if(isLoading) {
    return (
      <View style={styles.container}>
        <Logo />
        <Text>Carregando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Logo />
      {patients.map((i) => ( // This seems like placeholder data
        <TouchableOpacity key={i.id} style={styles.button} onPress={() => navigation.navigate('Menu',{patientId: i.id})}>
          <Text style={styles.buttonText}>{i.firstName} {i.lastName}</Text>
        </TouchableOpacity>
      ))}
      {/* <TouchableOpacity style={styles.newUserButton} onPress={() => alert('Novo usuário!')}>
        <Icon name="user-plus" size={30} color="#6200ee" />
        <Text style={styles.newUserButtonText}>Novo Usuário</Text>
      </TouchableOpacity> */}
      <TouchableOpacity onPress={()=>logoutUser(navigation)}>
        <Text style={{color:'#ca0000',marginVertical:5,padding:5}}>Sair</Text>
      </TouchableOpacity>
    </View>
  );
};

const MenuScreen: React.FC<MenuScreenProps> = ({ navigation,route }) => (
  <ScrollView contentContainerStyle={styles.container}>
    <Logo />
    <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('VerLocalizacao', { patientId: route.params.patientId })}>
      <Text style={styles.buttonText}>Ver Localização</Text>
    </TouchableOpacity>
    <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('ConfigurarDispositivo')}>
      <Text style={styles.buttonText}>Configurar Dispositivo</Text>
    </TouchableOpacity>
    {/* <TouchableOpacity style={styles.button} onPress={() => alert('Modo Emergência Ativado!')}>
      <Text style={styles.buttonText}>Emergência</Text>
    </TouchableOpacity> */}
  </ScrollView>
);

const ConfigurarDispositivoScreen: React.FC = () => (
  <View style={styles.container}>
    <Logo />
    <Text style={styles.text}>Ajustar Fonte e Sensibilidade</Text>
    <Text>(Simulação de sliders aqui)</Text>
  </View>
);


export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Registro" component={RegistroScreen} />
        <Stack.Screen name="SelecionarUsuario" component={SelecionarUsuarioScreen} />
        <Stack.Screen name="Patient" component={PatientScreen} />
        <Stack.Screen name="Menu" component={MenuScreen} />
        <Stack.Screen name="ConfigurarDispositivo" component={ConfigurarDispositivoScreen} />
        <Stack.Screen name="VerLocalizacao" component={VerLocalizacaoScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5
  },
  button: {
    backgroundColor: '#6200ee',
    padding: 15,
    borderRadius: 5,
    marginVertical: 5,
    width: '100%'
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold'
  },
  link: {
    marginTop: 10,
    color: '#6200ee'
  },
  noAccountText: {
    marginTop: 10,
    fontSize: 14,
    color: '#555'
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    width: '40%',
    justifyContent: 'center'
  },
  socialButtonText: {
    marginLeft: 10,
    fontSize: 16
  },
  newUserButton: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    width: '80%',
    justifyContent: 'center'
  },
  newUserButtonText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#6200ee'
  },
    selectorContainer: {
    flexDirection: 'row',
    marginVertical: 10,
    justifyContent: 'space-around',
  },
  option: {
    borderWidth: 1,
    borderColor: '#666',
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  selectedOption: {
    backgroundColor: '#0066cc',
    borderColor: '#004999',
  },
  optionText: {
    color: '#000',
  },
    map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 8,
    marginVertical: 4, // Aumentado um pouco para espaçamento
    backgroundColor: '#f0f0f0', // Cor de fundo sutil
    paddingHorizontal: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  infoLabel: {
    fontWeight: 'bold',
    color: '#333',
  },
  infoValue: {
    color: '#555',
    flexShrink: 1, // Permite que o texto quebre se for muito longo
    textAlign: 'right',
  },
  loadingText: {
    marginVertical: 10,
    fontStyle: 'italic',
    color: '#555',
    textAlign: 'center',
  },
  // Styles for PatientScreen
  patientScreenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff', // White background for a cleaner look
  },
  patientScreenEmergencyButton: {
    backgroundColor: '#d9534f', // Red color for emergency
    width: 220, // Larger button
    height: 220, // Larger button
    borderRadius: 110, // Make it circular
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    // Shadow for Android
    elevation: 8,
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
  },
  patientScreenEmergencyButtonText: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 15, // Space between icon and text
    textAlign: 'center',
  },
  logoutButtonPatient: { // Style for the logout button on PatientScreen
    marginTop: 30, // Add some space above the logout button
    paddingVertical: 10,
    paddingHorizontal: 20,
    // You can add more styling like background or border if needed
  },
  logoutButtonTextPatient: { // Style for the logout button text on PatientScreen
    color: '#ca0000', // Red color for logout
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: { // Adicionado para mensagens de erro
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
  },

});
