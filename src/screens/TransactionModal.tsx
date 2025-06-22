import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, Modal as ReactNativeModal } from 'react-native';
import { 
  Card, 
  Title, 
  TextInput, 
  Button, 
  SegmentedButtons,
  Menu,
  Text,
  Portal
} from 'react-native-paper';
import { BlurView } from 'expo-blur';
import { Calendar, LocaleConfig, DateData } from 'react-native-calendars';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TransactionService, NovaTransacao, NovaCategoria } from '../services/TransactionService';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

interface Categoria {
  id: number;
  nome: string;
  tipo: 'despesa' | 'receita';
}

interface Transacao {
  id?: number;
  tipo: 'despesa' | 'receita';
  descricao: string;
  valor: number;
  categoria_id: number;
  data: string;
  observacoes?: string;
}

interface TransactionModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  transacao?: Transacao | null;
}

// Configuração do Locale para pt-BR
LocaleConfig.locales['pt-br'] = {
  monthNames: ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'],
  monthNamesShort: ['Jan.','Fev.','Mar.','Abr.','Mai.','Jun.','Jul.','Ago.','Set.','Out.','Nov.','Dez.'],
  dayNames: ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'],
  dayNamesShort: ['Dom.','Seg.','Ter.','Qua.','Qui.','Sex.','Sáb.'],
  today: 'Hoje'
};
LocaleConfig.defaultLocale = 'pt-br';

export default function TransactionModal({ 
  visible, 
  onClose, 
  onSave, 
  transacao 
}: TransactionModalProps) {
  const { theme } = useTheme();
  const { usuario } = useAuth();
  const styles = useStyles(theme);
  
  const [tipo, setTipo] = useState<'despesa' | 'receita'>('despesa');
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [categoriaId, setCategoriaId] = useState<number | null>(null);
  const [data, setData] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [menuVisible, setMenuVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAddCategoryModalVisible, setAddCategoryModalVisible] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const isEditing = !!transacao?.id;

  useEffect(() => {
    setCategoriaId(null);
  }, [tipo]);

  useEffect(() => {
    if (visible && usuario) {
      carregarCategorias();
      if (isEditing && transacao) {
        setTipo(transacao.tipo);
        setDescricao(transacao.descricao);
        setValor(transacao.valor.toString());
        setCategoriaId(transacao.categoria_id);
        setData(transacao.data);
        setObservacoes(transacao.observacoes || '');
      } else {
        resetForm();
      }
    }
  }, [visible, transacao, usuario]);

  const carregarCategorias = async () => {
    if (!usuario) return;
    
    try {
      const categoriasData = await TransactionService.buscarCategorias(usuario.id);
      setCategorias(categoriasData);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const resetForm = () => {
    setTipo('despesa');
    setDescricao('');
    setValor('');
    setCategoriaId(null);
    setData(new Date().toISOString().split('T')[0]);
    setObservacoes('');
  };

  const handleValorChange = (texto: string) => {
    const comPonto = texto.replace(',', '.');
    const valido = /^\d*\.?\d*$/.test(comPonto);
    if(valido) setValor(comPonto);
  };

  const validarFormulario = () => {
    if (!descricao.trim()) {
      Alert.alert('Erro', 'Por favor, insira uma descrição');
      return false;
    }
    
    if (!valor || parseFloat(valor) <= 0) {
      Alert.alert('Erro', 'Por favor, insira um valor válido');
      return false;
    }
    
    if (!categoriaId) {
      Alert.alert('Erro', 'Por favor, selecione uma categoria');
      return false;
    }
    
    if (!data) {
      Alert.alert('Erro', 'Por favor, insira uma data');
      return false;
    }
    
    return true;
  };

  const handleSalvar = async () => {
    if (!usuario || !validarFormulario() || !categoriaId) return;

    setLoading(true);
    try {
      const novaTransacao: NovaTransacao = {
        tipo,
        descricao: descricao.trim(),
        valor: parseFloat(valor),
        categoria_id: categoriaId as number,
        data,
        observacoes: observacoes.trim() || undefined,
      };
      
      if (isEditing && transacao?.id) {
        const success = await TransactionService.atualizarTransacao(
          usuario.id,
          transacao.id,
          tipo,
          novaTransacao
        );
        if (success) {
          Alert.alert('Sucesso', 'Transação atualizada com sucesso!');
          onSave();
          onClose();
        } else {
          Alert.alert('Erro', 'Erro ao atualizar transação');
        }
      } else {
        const success = await TransactionService.criarTransacao(usuario.id, novaTransacao);
        if (success) {
          Alert.alert('Sucesso', 'Transação criada com sucesso!');
          onSave();
          onClose();
        } else {
          Alert.alert('Erro', 'Erro ao criar transação');
        }
      }
    } catch (error) {
      console.error('Erro ao salvar transação:', error);
      Alert.alert('Erro', 'Erro ao salvar transação');
    } finally {
      setLoading(false);
    }
  };

  const handleAdicionarCategoria = () => {
    setMenuVisible(false);
    setTimeout(() => {
      setNewCategoryName('');
      setAddCategoryModalVisible(true);
    }, 150);
  };

  const handleSalvarNovaCategoria = async () => {
    if (!newCategoryName.trim()) {
      Alert.alert('Erro', 'O nome da categoria não pode estar vazio.');
      return;
    }
    if (!usuario) return;

    setLoading(true);
    try {
      const novaCategoria: NovaCategoria = {
        nome: newCategoryName.trim(),
        tipo: tipo,
      };
      const categoriaCriada = await TransactionService.criarCategoria(usuario.id, novaCategoria);
      
      await carregarCategorias();
      setCategoriaId(categoriaCriada.id);
      
      setAddCategoryModalVisible(false);
      Alert.alert('Sucesso', `Categoria "${categoriaCriada.nome}" criada!`);

    } catch (error) {
      Alert.alert('Erro', 'Não foi possível criar a nova categoria.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleExcluir = () => {
    if (!usuario || !isEditing || !transacao?.id) return;

    Alert.alert(
      'Excluir Transação',
      'Tem certeza que deseja excluir esta transação?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: async () => {
            if (!transacao?.id) return;
            setLoading(true);
            try {
              const success = await TransactionService.excluirTransacao(
                usuario.id,
                transacao.id!,
                tipo
              );
              if (success) {
                Alert.alert('Sucesso', 'Transação excluída com sucesso!');
                onSave();
                onClose();
              } else {
                Alert.alert('Erro', 'Erro ao excluir transação');
              }
            } catch (error) {
              console.error('Erro ao excluir transação:', error);
              Alert.alert('Erro', 'Erro ao excluir transação');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const categoriasFiltradas = categorias.filter(c => c.tipo === tipo);

  const onDayPress = (day: DateData) => {
    setData(day.dateString);
  };

  if (!visible) return null;

  return (
    <ReactNativeModal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <Portal.Host>
        <KeyboardAvoidingView
          style={styles.outerContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <BlurView
            style={StyleSheet.absoluteFill}
            tint={theme.blur.tint as any}
            intensity={30}
          />
          <View style={styles.modalContainer}>
            <Card style={styles.card}>
              <Card.Title 
                title={isEditing ? 'Editar' : 'Nova'} 
                subtitle="Transação" 
                titleStyle={styles.title} 
              />
              <ScrollView style={styles.scrollView}>
                <Card.Content>
                  <SegmentedButtons
                    value={tipo}
                    onValueChange={(value) => {
                      if (value === 'despesa' || value === 'receita') {
                        setTipo(value);
                      }
                    }}
                    buttons={[
                      { value: 'despesa', label: 'Despesa', icon: 'cash-minus' },
                      { value: 'receita', label: 'Receita', icon: 'cash-plus' },
                    ]}
                    style={styles.segmentedButtons}
                  />

                  <TextInput
                    label="Descrição"
                    value={descricao}
                    onChangeText={setDescricao}
                    mode="outlined"
                    style={styles.input}
                    left={<TextInput.Icon icon="pencil" />}
                  />
                  
                  <View style={styles.row}>
                    <TextInput
                      label="Valor"
                      value={valor}
                      onChangeText={handleValorChange}
                      mode="outlined"
                      keyboardType="numeric"
                      style={[styles.input, styles.flexInput]}
                      left={<TextInput.Icon icon="cash" />}
                    />
                    
                    <Menu
                      visible={menuVisible}
                      onDismiss={() => setMenuVisible(false)}
                      anchor={
                        <TouchableOpacity onPress={() => setMenuVisible(true)} style={[styles.input, styles.flexInput, styles.categoryButton]}>
                          <Text style={styles.categoryButtonText}>
                            {categoriaId 
                              ? categorias.find(c => c.id === categoriaId)?.nome 
                              : 'Categoria'}
                          </Text>
                          <MaterialCommunityIcons name="chevron-down" size={24} color={theme.colors.textSecondary} />
                        </TouchableOpacity>
                      }
                    >
                      {categoriasFiltradas.map(c => (
                        <Menu.Item 
                          key={c.id}
                          onPress={() => {
                            setCategoriaId(c.id);
                            setMenuVisible(false);
                          }} 
                          title={c.nome}
                        />
                      ))}
                      <Menu.Item 
                        onPress={handleAdicionarCategoria}
                        title="Adicionar Nova..."
                      />
                    </Menu>
                  </View>

                  <Calendar
                    current={data}
                    onDayPress={onDayPress}
                    enableSwipeMonths={true}
                    markedDates={{
                      [data]: { selected: true, marked: true, selectedColor: theme.colors.primary }
                    }}
                    theme={{
                      backgroundColor: 'transparent',
                      calendarBackground: 'transparent',
                      textSectionTitleColor: theme.colors.textSecondary,
                      selectedDayBackgroundColor: theme.colors.primary,
                      selectedDayTextColor: theme.colors.onPrimary,
                      todayTextColor: theme.colors.primary,
                      dayTextColor: theme.colors.text,
                      textDisabledColor: theme.colors.textSecondary,
                      arrowColor: theme.colors.primary,
                      monthTextColor: theme.colors.text,
                      indicatorColor: theme.colors.primary,
                      textDayFontWeight: '300',
                      textMonthFontWeight: 'bold',
                      textDayHeaderFontWeight: '300',
                      textDayFontSize: 16,
                      textMonthFontSize: 16,
                      textDayHeaderFontSize: 16
                    }}
                    style={{ marginBottom: 16 }}
                  />
                  
                  <TextInput
                    label="Observações (opcional)"
                    value={observacoes}
                    onChangeText={setObservacoes}
                    mode="outlined"
                    style={styles.input}
                    multiline
                    left={<TextInput.Icon icon="text" />}
                  />
                </Card.Content>
              </ScrollView>
              <Card.Actions style={styles.cardActions}>
                <Button onPress={onClose} mode="outlined" style={styles.buttonSpaced}>
                  Cancelar
                </Button>
                <Button onPress={handleSalvar} mode="contained" loading={loading} style={styles.buttonSpaced}>
                  Salvar
                </Button>
              </Card.Actions>
              {isEditing && (
                <Card.Actions style={{ justifyContent: 'center', paddingBottom: 16 }}>
                   <Button 
                    onPress={handleExcluir} 
                    mode="outlined" 
                    icon="delete"
                    style={styles.deleteButton}
                    textColor={theme.colors.error}
                  >
                    Excluir
                  </Button>
                </Card.Actions>
              )}
            </Card>
          </View>
        </KeyboardAvoidingView>

        {/* Modal de Adicionar Categoria como um Overlay */}
        {isAddCategoryModalVisible && (
          <View style={styles.overlayContainer}>
             <BlurView
              style={StyleSheet.absoluteFill}
              tint={theme.blur.tint as any}
              intensity={20}
            />
            <Card style={styles.addCategoryCard}>
              <Card.Title title="Nova Categoria" titleStyle={styles.title} />
              <Card.Content>
                <TextInput label="Nome da Categoria" value={newCategoryName} onChangeText={setNewCategoryName} mode="outlined" style={styles.input} autoFocus />
              </Card.Content>
              <Card.Actions>
                <Button onPress={() => setAddCategoryModalVisible(false)} style={styles.buttonSpaced}>Cancelar</Button>
                <Button onPress={handleSalvarNovaCategoria} mode="contained" loading={loading} style={styles.buttonSpaced}>Salvar</Button>
              </Card.Actions>
            </Card>
          </View>
        )}
      </Portal.Host>
    </ReactNativeModal>
  );
}

const useStyles = (theme: any) => StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxHeight: '95%',
    backgroundColor: theme.colors.surface + 'B3',
    borderColor: theme.colors.border + '40',
    borderWidth: 1,
  },
  title: {
    textAlign: 'center',
    paddingTop: 16,
  },
  scrollView: {
    //
  },
  cardActions: {
    padding: 16,
    borderTopWidth: 1,
    borderColor: theme.colors.divider,
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  buttonSpaced: {
    flex: 1,
    marginHorizontal: 4,
  },
  deleteButton: {
    marginTop: 16,
    borderColor: theme.colors.error,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  flexInput: {
    flex: 1,
    marginLeft: 4,
    marginRight: 4,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 4,
  },
  categoryButtonText: {
    color: theme.colors.text,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 4,
    marginBottom: 16,
  },
  datePickerText: {
    marginLeft: 10,
    color: theme.colors.text,
    fontSize: 16,
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  addCategoryCard: { width: '100%', backgroundColor: theme.colors.surface },
}); 