import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { 
  Card, 
  Title, 
  Text, 
  Button, 
  Chip, 
  TextInput, 
  FAB,
  List,
  Divider,
  Searchbar,
  Menu,
  IconButton,
  Icon
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TransactionService, Transacao, Categoria } from '../services/TransactionService';
import { useTheme } from '../contexts/ThemeContext';
import TransactionModal from './TransactionModal';
import { useAuth } from '../contexts/AuthContext';
import GlassCard from '../components/GlassCard';
import { useFAB } from '../contexts/FABContext';
import { useHeaderHeight } from '@react-navigation/elements';

export default function TransactionsScreen() {
  const { theme } = useTheme();
  const { usuario } = useAuth();
  const { setOnFABPress } = useFAB();
  const styles = useStyles(theme);
  const headerHeight = useHeaderHeight();
  
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [transacaoEditando, setTransacaoEditando] = useState<Transacao | null>(null);
  const [filtrosVisiveis, setFiltrosVisiveis] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState<string>('');
  const [filtroCategoria, setFiltroCategoria] = useState<number | null>(null);
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');
  const [filtroValorMin, setFiltroValorMin] = useState('');
  const [filtroValorMax, setFiltroValorMax] = useState('');
  const [transacoesFiltradas, setTransacoesFiltradas] = useState<Transacao[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  useEffect(() => {
    if (usuario) {
      carregarDados();
    }
  }, [usuario]);

  useEffect(() => {
    setOnFABPress(handleNovaTransacao);
  }, [setOnFABPress]);

  const carregarDados = async () => {
    if (!usuario) return;
    
    try {
      const [categoriasData, transacoesData] = await Promise.all([
        TransactionService.buscarCategorias(usuario.id),
        TransactionService.buscarTodas(usuario.id),
      ]);
      
      setCategorias(categoriasData);
      setTransacoes(transacoesData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      Alert.alert('Erro', 'Erro ao carregar transações');
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = () => {
    let transacoesFiltradas = transacoes;

    // Filtro por tipo
    if (filtroTipo && filtroTipo !== 'todos') {
      transacoesFiltradas = transacoesFiltradas.filter(t => t.tipo === filtroTipo);
    }

    // Filtro por categoria
    if (filtroCategoria) {
      const categoria = categorias.find(c => c.id === filtroCategoria);
      if (categoria) {
        transacoesFiltradas = transacoesFiltradas.filter(t => t.categoria === categoria.nome);
      }
    }

    // Filtro por data
    if (filtroDataInicio) {
      transacoesFiltradas = transacoesFiltradas.filter(t => t.data >= filtroDataInicio);
    }
    if (filtroDataFim) {
      transacoesFiltradas = transacoesFiltradas.filter(t => t.data <= filtroDataFim);
    }

    // Filtro por valor
    if (filtroValorMin) {
      transacoesFiltradas = transacoesFiltradas.filter(t => t.valor >= parseFloat(filtroValorMin));
    }
    if (filtroValorMax) {
      transacoesFiltradas = transacoesFiltradas.filter(t => t.valor <= parseFloat(filtroValorMax));
    }

    // Filtro por busca
    if (searchQuery) {
      transacoesFiltradas = transacoesFiltradas.filter(t => 
        t.descricao.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.categoria.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return transacoesFiltradas;
  };

  const limparFiltros = () => {
    setFiltroTipo('');
    setFiltroCategoria(null);
    setFiltroDataInicio('');
    setFiltroDataFim('');
    setFiltroValorMin('');
    setFiltroValorMax('');
    setSearchQuery('');
  };

  const getNomeCategoria = (categoriaId: number) => {
    const categoria = categorias.find(c => c.id === categoriaId);
    return categoria ? categoria.nome : 'Sem Categoria';
  };

  const formatarValor = (valor: number) => {
    return `R$ ${valor.toFixed(2).replace('.', ',')}`;
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR');
  };

  const getIconeTipo = (tipo: string) => {
    return tipo === 'despesa' ? 'cash-minus' : 'cash-plus';
  };

  const getCorTipo = (tipo: string) => {
    return tipo === 'despesa' ? theme.colors.error : theme.colors.success;
  };

  const handleNovaTransacao = () => {
    setTransacaoEditando(null);
    setModalVisible(true);
  };

  const handleEditarTransacao = (transacao: Transacao) => {
    setTransacaoEditando(transacao);
    setModalVisible(true);
  };

  const handleSalvarTransacao = () => {
    carregarDados();
  };

  // Aplicar filtros e calcular totais
  const transacoesFiltradasResult = aplicarFiltros();
  const totalReceitas = transacoesFiltradasResult
    .filter(t => t.tipo === 'receita')
    .reduce((sum, t) => sum + t.valor, 0);
  const totalDespesas = transacoesFiltradasResult
    .filter(t => t.tipo === 'despesa')
    .reduce((sum, t) => sum + t.valor, 0);
  const saldo = totalReceitas - totalDespesas;

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={{ paddingTop: headerHeight, paddingBottom: 120 }}
      >
        {/* Resumo */}
        <GlassCard>
          <Title style={styles.title}>Resumo</Title>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Receitas</Text>
              <Text style={[styles.summaryValue, { color: theme.colors.success }]}>
                {formatarValor(totalReceitas)}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Despesas</Text>
              <Text style={[styles.summaryValue, { color: theme.colors.error }]}>
                {formatarValor(totalDespesas)}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Saldo</Text>
              <Text style={[styles.summaryValue, { color: saldo >= 0 ? theme.colors.success : theme.colors.error }]}>
                {formatarValor(saldo)}
              </Text>
            </View>
          </View>
        </GlassCard>

        {/* Filtros */}
        <GlassCard>
          <View style={styles.filtersHeader}>
            <Title style={styles.title}>Filtros</Title>
            <IconButton
              icon={showFilters ? 'chevron-up' : 'chevron-down'}
              onPress={() => setShowFilters(!showFilters)}
              iconColor={theme.colors.primary}
            />
          </View>

          {showFilters && (
            <View style={styles.filtersContent}>
              <Searchbar
                placeholder="Buscar transações..."
                onChangeText={setSearchQuery}
                value={searchQuery}
                style={styles.searchBar}
                iconColor={theme.colors.primary}
              />

              <View style={styles.filterRow}>
                <Text style={styles.filterLabel}>Tipo:</Text>
                <View style={styles.chipContainer}>
                  <Chip
                    selected={filtroTipo === 'todos'}
                    onPress={() => setFiltroTipo('todos')}
                    style={styles.chip}
                    selectedColor={theme.colors.primary}
                  >
                    Todos
                  </Chip>
                  <Chip
                    selected={filtroTipo === 'receita'}
                    onPress={() => setFiltroTipo('receita')}
                    style={styles.chip}
                    selectedColor={theme.colors.success}
                  >
                    Receitas
                  </Chip>
                  <Chip
                    selected={filtroTipo === 'despesa'}
                    onPress={() => setFiltroTipo('despesa')}
                    style={styles.chip}
                    selectedColor={theme.colors.error}
                  >
                    Despesas
                  </Chip>
                </View>
              </View>

              <View style={styles.filterRow}>
                <Text style={styles.filterLabel}>Categoria:</Text>
                <Menu
                  visible={menuVisible}
                  onDismiss={() => setMenuVisible(false)}
                  anchor={
                    <Button
                      mode="outlined"
                      onPress={() => setMenuVisible(true)}
                      style={styles.categoryButton}
                      textColor={theme.colors.primary}
                    >
                      {filtroCategoria 
                        ? categorias.find(c => c.id === filtroCategoria)?.nome 
                        : 'Todas as categorias'}
                    </Button>
                  }
                >
                  <Menu.Item
                    onPress={() => {
                      setFiltroCategoria(null);
                      setMenuVisible(false);
                    }}
                    title="Todas as categorias"
                  />
                  {categorias.map(categoria => (
                    <Menu.Item
                      key={categoria.id}
                      onPress={() => {
                        setFiltroCategoria(categoria.id);
                        setMenuVisible(false);
                      }}
                      title={categoria.nome}
                    />
                  ))}
                </Menu>
              </View>

              <View style={styles.filterRow}>
                <TextInput
                  label="Data início"
                  value={filtroDataInicio}
                  onChangeText={setFiltroDataInicio}
                  mode="outlined"
                  style={[styles.input, { flex: 1, marginRight: theme.spacing.sm }]}
                  placeholder="YYYY-MM-DD"
                  theme={{ colors: { primary: theme.colors.primary } }}
                />
                <TextInput
                  label="Data fim"
                  value={filtroDataFim}
                  onChangeText={setFiltroDataFim}
                  mode="outlined"
                  style={[styles.input, { flex: 1 }]}
                  placeholder="YYYY-MM-DD"
                  theme={{ colors: { primary: theme.colors.primary } }}
                />
              </View>

              <View style={styles.filterRow}>
                <TextInput
                  label="Valor mínimo"
                  value={filtroValorMin}
                  onChangeText={setFiltroValorMin}
                  mode="outlined"
                  keyboardType="numeric"
                  style={[styles.input, { flex: 1, marginRight: theme.spacing.sm }]}
                  placeholder="0,00"
                  theme={{ colors: { primary: theme.colors.primary } }}
                />
                <TextInput
                  label="Valor máximo"
                  value={filtroValorMax}
                  onChangeText={setFiltroValorMax}
                  mode="outlined"
                  keyboardType="numeric"
                  style={[styles.input, { flex: 1 }]}
                  placeholder="0,00"
                  theme={{ colors: { primary: theme.colors.primary } }}
                />
              </View>

              <Button
                mode="outlined"
                onPress={limparFiltros}
                style={styles.clearButton}
                textColor={theme.colors.primary}
              >
                Limpar Filtros
              </Button>
            </View>
          )}
        </GlassCard>

        {/* Lista de Transações */}
        <GlassCard>
          <Title style={styles.title}>
            Transações ({transacoesFiltradasResult.length})
          </Title>
          
          {transacoesFiltradasResult.length === 0 ? (
            <Text style={styles.emptyText}>
              Nenhuma transação encontrada
            </Text>
          ) : (
            transacoesFiltradasResult.map((item, index) => (
              <View key={item.id}>
                <TouchableOpacity
                  onPress={() => handleEditarTransacao(item)}
                  style={styles.transactionItem}
                >
                  <View style={styles.transactionIcon}>
                    <Icon
                      source={getIconeTipo(item.tipo)}
                      size={24}
                      color={getCorTipo(item.tipo)}
                    />
                  </View>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionDescription}>{item.descricao}</Text>
                    <Text style={styles.transactionCategory}>{item.categoria}</Text>
                    <Text style={styles.transactionDate}>{formatarData(item.data)}</Text>
                  </View>
                  <View style={styles.transactionValue}>
                    <Text style={[styles.transactionAmount, { color: getCorTipo(item.tipo) }]}>
                      {item.tipo === 'despesa' ? '-' : '+'}{formatarValor(item.valor)}
                    </Text>
                  </View>
                </TouchableOpacity>
                {index < transacoesFiltradasResult.length - 1 && <Divider />}
              </View>
            ))
          )}
        </GlassCard>
      </ScrollView>

      <TransactionModal
        key="transaction-modal"
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSalvarTransacao}
        transacao={transacaoEditando}
      />
    </View>
  );
}

const useStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  title: {
    ...theme.typography.h4,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  summaryValue: {
    ...theme.typography.body,
    fontWeight: 'bold',
  },
  filtersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filtersContent: {
    marginTop: theme.spacing.md,
  },
  searchBar: {
    marginBottom: theme.spacing.md,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  filterLabel: {
    ...theme.typography.body,
    marginRight: theme.spacing.sm,
    minWidth: 80,
    color: theme.colors.text,
  },
  chipContainer: {
    flexDirection: 'row',
    flex: 1,
  },
  chip: {
    marginRight: theme.spacing.sm,
  },
  categoryButton: {
    flex: 1,
  },
  input: {
    backgroundColor: theme.colors.surface,
  },
  clearButton: {
    marginTop: theme.spacing.sm,
  },
  emptyText: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    marginTop: theme.spacing.lg,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.sm,
  },
  transactionIcon: {
    marginRight: theme.spacing.sm,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    ...theme.typography.body,
    color: theme.colors.text,
  },
  transactionCategory: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  transactionDate: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  transactionValue: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    ...theme.typography.body,
    fontWeight: 'bold',
  },
}); 