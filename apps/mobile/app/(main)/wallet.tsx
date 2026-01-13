// app/(main)/wallet.tsx

import React from 'react';
import {
  View,
  StyleSheet,
  SectionList,
  FlatList,
  RefreshControl,
} from 'react-native';
import { COLORS, SPACING } from '../../src/lib/constants';
import { useWallet } from '../../src/hooks/useWallet';
import {
  WalletHeader,
  SegmentTabs,
  TransactionCard,
  RedemptionCard,
  SectionHeader,
  EmptyWallet,
} from '../../src/components/wallet';
import { FullScreenLoading } from '../../src/components/ui/Loading';
import type {
  Transaction,
  CustomerRedemption,
} from '../../src/types/wallet.types';

export default function WalletScreen() {
  const {
    activeTab,
    setActiveTab,
    groupedTransactions,
    activeRedemptions,
    pastRedemptions,
    currentPoints,
    lifetimePoints,
    isLoading,
    isRefreshing,
    refresh,
  } = useWallet();

  const handleTransactionPress = (transaction: Transaction) => {
    console.log('Transaction pressed:', transaction.id);
    // Could open detail modal
  };

  const handleRedemptionPress = (redemption: CustomerRedemption) => {
    console.log('Redemption pressed:', redemption.id);
    // Could open detail modal with QR code
  };

  if (isLoading) {
    return <FullScreenLoading />;
  }

  return (
    <View style={styles.container}>
      {/* Header with Points */}
      <WalletHeader
        currentPoints={currentPoints}
        lifetimePoints={lifetimePoints}
      />

      {/* Tab Selector */}
      <SegmentTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Content */}
      {activeTab === 'transactions' ? (
        <TransactionsTab
          groupedTransactions={groupedTransactions}
          isRefreshing={isRefreshing}
          onRefresh={refresh}
          onTransactionPress={handleTransactionPress}
        />
      ) : (
        <RewardsTab
          activeRedemptions={activeRedemptions}
          pastRedemptions={pastRedemptions}
          isRefreshing={isRefreshing}
          onRefresh={refresh}
          onRedemptionPress={handleRedemptionPress}
        />
      )}
    </View>
  );
}

// Transactions Tab Component
interface TransactionsTabProps {
  groupedTransactions: { title: string; data: Transaction[] }[];
  isRefreshing: boolean;
  onRefresh: () => void;
  onTransactionPress: (transaction: Transaction) => void;
}

function TransactionsTab({
  groupedTransactions,
  isRefreshing,
  onRefresh,
  onTransactionPress,
}: TransactionsTabProps) {
  if (groupedTransactions.length === 0) {
    return <EmptyWallet type="transactions" />;
  }

  return (
    <SectionList
      sections={groupedTransactions}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={styles.cardWrapper}>
          <TransactionCard transaction={item} onPress={onTransactionPress} />
        </View>
      )}
      renderSectionHeader={({ section: { title } }) => (
        <SectionHeader title={title} />
      )}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor={COLORS.primary}
        />
      }
      stickySectionHeadersEnabled={false}
    />
  );
}

// Rewards Tab Component
interface RewardsTabProps {
  activeRedemptions: CustomerRedemption[];
  pastRedemptions: CustomerRedemption[];
  isRefreshing: boolean;
  onRefresh: () => void;
  onRedemptionPress: (redemption: CustomerRedemption) => void;
}

function RewardsTab({
  activeRedemptions,
  pastRedemptions,
  isRefreshing,
  onRefresh,
  onRedemptionPress,
}: RewardsTabProps) {
  const allRedemptions = [
    ...(activeRedemptions.length > 0
      ? [{ title: 'ACTIVE', data: activeRedemptions }]
      : []),
    ...(pastRedemptions.length > 0
      ? [{ title: 'HISTORY', data: pastRedemptions }]
      : []),
  ];

  if (allRedemptions.length === 0) {
    return <EmptyWallet type="rewards" />;
  }

  return (
    <SectionList
      sections={allRedemptions}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={styles.cardWrapper}>
          <RedemptionCard redemption={item} onPress={onRedemptionPress} />
        </View>
      )}
      renderSectionHeader={({ section: { title } }) => (
        <SectionHeader title={title} />
      )}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor={COLORS.primary}
          colors={[COLORS.primary]}
        />
      }
      stickySectionHeadersEnabled={false}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F7F9',
  },
  listContent: {
    paddingBottom: 120,
  },
  cardWrapper: {
    paddingHorizontal: SPACING.lg,
  },
});
