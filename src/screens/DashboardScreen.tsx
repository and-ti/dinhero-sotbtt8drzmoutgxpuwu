import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Title, 
  Text, 
  Button, 
  Card, 
  List,
  Divider,
  IconButton
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TransactionService, Transacao, Categoria } from '../services/TransactionService';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import TransactionModal from './TransactionModal';
import GlassCard from '../components/GlassCard';
import { useFAB } from '../contexts/FABContext';
import { useHeaderHeight } from '@react-navigation/elements';

export default function DashboardScreen() {
  const { theme } = useTheme();
  const { usuario } = useAuth();
  const { setOnFABPress } = useFAB();
  const styles = useStyles(theme);
  const headerHeight = useHeaderHeight();
  
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

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
    
    setLoading(true);
    try {
      const [transacoesData, categoriasData] = await Promise.all([
        TransactionService.buscarTodas(usuario.id),
        TransactionService.buscarCategorias(usuario.id)
      ]);
      setTransacoes(transacoesData);
      setCategorias(categoriasData);
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
      Alert.alert('Erro', 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
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
    setModalVisible(true);
  };

  const handleSalvarTransacao = () => {
    carregarDados();
  };

  const transacoesRecentes = transacoes
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
    .slice(0, 5);

  const totalReceitas = transacoes
    .filter(t => t.tipo === 'receita')
    .reduce((sum, t) => sum + t.valor, 0);
  const totalDespesas = transacoes
    .filter(t => t.tipo === 'despesa')
    .reduce((sum, t) => sum + t.valor, 0);
  const saldo = totalReceitas - totalDespesas;

  return (
    <View style={styles.container}>
      {/* Gradiente de fundo */}
      <LinearGradient
        colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
        style={styles.gradientBackground}
        start={{ x: 0.1, y: 0.1 }}
        end={{ x: 1, y: 1 }}
      />
      <ScrollView 
        style={styles.scrollContainer} 
        contentContainerStyle={{ paddingTop: headerHeight, paddingBottom: 120 }}
      >
        {/* Saudação personalizada */}
        <GlassCard style={{ marginBottom: 16, padding: 0 }}>
          <View style={styles.greetingRow}>
            <View>
              <Text style={styles.greetingText}>Olá{usuario?.nome_completo ? `, ${usuario.nome_completo}` : ''}</Text>
              <Text style={styles.greetingSubtext}>Bem-vindo de volta!</Text>
            </View>
            <View style={styles.avatarContainer}>
              <Image
                source={require('../../assets/icon.png')}
                style={styles.avatar}
              />
            </View>
          </View>
        </GlassCard>
        {/* Resumo Financeiro */}
        <GlassCard style={{}}>
          <Title style={styles.title}>Resumo Financeiro</Title>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <MaterialCommunityIcons
                name="cash-plus"
                size={32}
                color={theme.colors.success}
                style={styles.summaryIcon}
              />
              <Text style={styles.summaryLabel}>Receitas</Text>
              <Text style={[styles.summaryValue, { color: theme.colors.success }]}>
                {formatarValor(totalReceitas)}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <MaterialCommunityIcons
                name="cash-minus"
                size={32}
                color={theme.colors.error}
                style={styles.summaryIcon}
              />
              <Text style={styles.summaryLabel}>Despesas</Text>
              <Text style={[styles.summaryValue, { color: theme.colors.error }]}>
                {formatarValor(totalDespesas)}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <MaterialCommunityIcons
                name="wallet"
                size={32}
                color={saldo >= 0 ? theme.colors.success : theme.colors.error}
                style={styles.summaryIcon}
              />
              <Text style={styles.summaryLabel}>Saldo</Text>
              <Text style={[styles.summaryValue, { color: saldo >= 0 ? theme.colors.success : theme.colors.error }]}>
                {formatarValor(saldo)}
              </Text>
            </View>
          </View>
        </GlassCard>

        {/* Ações Rápidas */}
        <GlassCard style={{}}>
          <Title style={styles.title}>Ações Rápidas</Title>
          <View style={styles.actionsRow}>
            <Button
              mode="contained"
              icon="plus"
              onPress={handleNovaTransacao}
              style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
              textColor={theme.colors.surface}
            >
              Nova Transação
            </Button>
            <Button
              mode="outlined"
              icon="chart-line"
              onPress={() => {}}
              style={styles.actionButton}
              textColor={theme.colors.primary}
            >
              Relatórios
            </Button>
          </View>
        </GlassCard>

        {/* Transações Recentes */}
        <GlassCard style={{}}>
          <Title style={styles.title}>Transações Recentes</Title>
          
          {transacoesRecentes.length === 0 ? (
            <Text style={styles.emptyText}>
              Nenhuma transação encontrada
            </Text>
          ) : (
            transacoesRecentes.map((transacao, index) => (
              <View key={transacao.id}>
                <List.Item
                  title={transacao.descricao}
                  description={`${getNomeCategoria(transacao.categoria_id)} • ${formatarData(transacao.data)}`}
                  left={() => (
                    <MaterialCommunityIcons
                      name={getIconeTipo(transacao.tipo) as any}
                      size={24}
                      color={getCorTipo(transacao.tipo)}
                      style={styles.transactionIcon}
                    />
                  )}
                  right={() => (
                    <Text style={[styles.transactionValue, { color: getCorTipo(transacao.tipo) }]}>
                      {transacao.tipo === 'despesa' ? '-' : '+'}{formatarValor(transacao.valor)}
                    </Text>
                  )}
                  style={styles.transactionItem}
                  titleStyle={{ color: theme.colors.text }}
                  descriptionStyle={{ color: theme.colors.textSecondary }}
                />
                {index < transacoesRecentes.length - 1 && <Divider />}
              </View>
            ))
          )}
          
          {transacoes.length > 5 && (
            <Button
              mode="text"
              onPress={() => {}}
              style={styles.viewAllButton}
              textColor={theme.colors.primary}
            >
              Ver todas as transações
            </Button>
          )}
        </GlassCard>

        {/* Dicas */}
        <GlassCard style={{}}>
          <Title style={styles.title}>Dicas do DinHero</Title>
          <View style={styles.tipContainer}>
            <MaterialCommunityIcons
              name="lightbulb-on"
              size={24}
              color={theme.colors.warning}
              style={styles.tipIcon}
            />
            <Text style={styles.tipText}>
              Mantenha suas transações sempre atualizadas para ter um controle financeiro mais preciso!
            </Text>
          </View>
        </GlassCard>

        {/* Cartões de Resumo (Sales, Profit, Orders) */}
        <View style={{ flexDirection: 'column', gap: 16, marginBottom: 24 }}>
          <GlassCard style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 20, paddingHorizontal: 20 }}>
            <View>
              <Text style={{ color: theme.colors.textSecondary, fontSize: 14 }}>Vendas</Text>
              <Text style={{ color: '#FFD166', fontWeight: 'bold', fontSize: 22 }}>$500</Text>
              <ProgressBar progress={0.55} color={'#FFD166'} />
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: '#FFD166', fontWeight: 'bold', fontSize: 16 }}>55%</Text>
            </View>
          </GlassCard>
          <GlassCard style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 20, paddingHorizontal: 20 }}>
            <View>
              <Text style={{ color: theme.colors.textSecondary, fontSize: 14 }}>Lucro</Text>
              <Text style={{ color: '#06D6A0', fontWeight: 'bold', fontSize: 22 }}>$150</Text>
              <ProgressBar progress={0.3} color={'#06D6A0'} />
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: '#06D6A0', fontWeight: 'bold', fontSize: 16 }}>30%</Text>
            </View>
          </GlassCard>
          <GlassCard style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 20, paddingHorizontal: 20 }}>
            <View>
              <Text style={{ color: theme.colors.textSecondary, fontSize: 14 }}>Pedidos</Text>
              <Text style={{ color: '#118AB2', fontWeight: 'bold', fontSize: 22 }}>1000</Text>
              <ProgressBar progress={0.8} color={'#118AB2'} />
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: '#118AB2', fontWeight: 'bold', fontSize: 16 }}>80%</Text>
            </View>
          </GlassCard>
        </View>
      </ScrollView>

      <TransactionModal
        key="dashboard-transaction-modal"
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSalvarTransacao}
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
  summaryIcon: {
    marginBottom: theme.spacing.xs,
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
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
  },
  emptyText: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    marginTop: theme.spacing.lg,
  },
  transactionItem: {
    paddingVertical: theme.spacing.sm,
  },
  transactionIcon: {
    marginTop: theme.spacing.sm,
  },
  transactionValue: {
    ...theme.typography.body,
    fontWeight: 'bold',
    marginTop: theme.spacing.sm,
  },
  viewAllButton: {
    marginTop: theme.spacing.md,
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tipIcon: {
    marginRight: theme.spacing.sm,
    marginTop: 2,
  },
  tipText: {
    ...theme.typography.body,
    color: theme.colors.text,
    flex: 1,
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greetingText: {
    ...theme.typography.h4,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  greetingSubtext: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  avatarContainer: {
    marginLeft: theme.spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
});

function ProgressBar({ progress, color }: { progress: number; color: string }) {
  return (
    <View style={{ height: 8, backgroundColor: '#2226', borderRadius: 8, overflow: 'hidden', marginTop: 8 }}>
      <View style={{ width: `${progress * 100}%`, height: 8, backgroundColor: color, borderRadius: 8 }} />
    </View>
  );
} 