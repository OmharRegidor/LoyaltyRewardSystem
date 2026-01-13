// apps/web/lib/pdf/loyalty-card.tsx

import React from 'react';
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from '@react-pdf/renderer';

// ============================================
// TYPES
// ============================================

interface LoyaltyCardPDFProps {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  tier: string;
  totalPoints: number;
  qrCodeDataUrl: string;
  businessName: string;
  businessLogo: string | null;
  businessAddress: string | null;
  businessCity: string | null;
}

// ============================================
// TIER COLORS
// ============================================

const TIER_COLORS: Record<string, { primary: string; secondary: string }> = {
  bronze: { primary: '#92400E', secondary: '#B45309' },
  silver: { primary: '#4B5563', secondary: '#6B7280' },
  gold: { primary: '#CA8A04', secondary: '#EAB308' },
  platinum: { primary: '#334155', secondary: '#475569' },
};

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#F3F4F6',
    padding: 40,
    fontFamily: 'Helvetica',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },
  cardHeader: {
    padding: 24,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  businessName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  businessSubtitle: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  qrContainer: {
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 8,
  },
  qrCode: {
    width: 100,
    height: 100,
  },
  memberSection: {
    padding: 24,
    paddingTop: 8,
  },
  tierBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 8,
  },
  tierBadgeText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  customerName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  pointsText: {
    fontSize: 12,
    color: '#6366F1',
    fontWeight: 'bold',
  },
  detailsSection: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailIcon: {
    width: 16,
    marginRight: 8,
    fontSize: 10,
  },
  detailText: {
    fontSize: 10,
    color: '#4B5563',
  },
  footer: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 8,
    color: '#6B7280',
  },
  footerBrand: {
    fontSize: 8,
    color: '#111827',
    fontWeight: 'bold',
  },
  instructions: {
    marginTop: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  instructionItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  instructionNumber: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#6366F1',
    marginRight: 8,
    width: 16,
  },
  instructionText: {
    fontSize: 10,
    color: '#4B5563',
    flex: 1,
  },
  tipBox: {
    marginTop: 16,
    backgroundColor: '#EEF2FF',
    padding: 12,
    borderRadius: 8,
  },
  tipText: {
    fontSize: 9,
    color: '#4338CA',
  },
});

// ============================================
// COMPONENT
// ============================================

export function LoyaltyCardPDF({
  customerName,
  customerEmail,
  customerPhone,
  tier,
  totalPoints,
  qrCodeDataUrl,
  businessName,
  businessLogo,
  businessAddress,
  businessCity,
}: LoyaltyCardPDFProps) {
  const tierColors = TIER_COLORS[tier] || TIER_COLORS.bronze;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Main Card */}
        <View style={styles.card}>
          {/* Header with gradient background */}
          <View
            style={[styles.cardHeader, { backgroundColor: tierColors.primary }]}
          >
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.businessName}>{businessName}</Text>
                <Text style={styles.businessSubtitle}>
                  Loyalty Rewards Program
                </Text>
              </View>
              <View style={styles.qrContainer}>
                <Image src={qrCodeDataUrl} style={styles.qrCode} />
              </View>
            </View>
          </View>

          {/* Member Info */}
          <View style={styles.memberSection}>
            <View
              style={[
                styles.tierBadge,
                { backgroundColor: tierColors.secondary },
              ]}
            >
              <Text style={styles.tierBadgeText}>{tier} Member</Text>
            </View>
            <Text style={styles.customerName}>{customerName}</Text>
            <View style={styles.pointsBadge}>
              <Text style={styles.pointsText}>
                ⭐ {totalPoints.toLocaleString()} points
              </Text>
            </View>
          </View>

          {/* Details Section */}
          <View style={styles.detailsSection}>
            {businessAddress && (
              <View style={styles.detailRow}>
                <Text style={styles.detailIcon}>📍</Text>
                <Text style={styles.detailText}>
                  {businessAddress}
                  {businessCity ? `, ${businessCity}` : ''}
                </Text>
              </View>
            )}
            {customerPhone && (
              <View style={styles.detailRow}>
                <Text style={styles.detailIcon}>📞</Text>
                <Text style={styles.detailText}>{customerPhone}</Text>
              </View>
            )}
            {customerEmail && (
              <View style={styles.detailRow}>
                <Text style={styles.detailIcon}>✉️</Text>
                <Text style={styles.detailText}>{customerEmail}</Text>
              </View>
            )}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Digital Loyalty Card</Text>
            <Text style={styles.footerText}>
              Powered by <Text style={styles.footerBrand}>LoyaltyHub</Text>
            </Text>
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionsTitle}>How to use your card</Text>

          <View style={styles.instructionItem}>
            <Text style={styles.instructionNumber}>1.</Text>
            <Text style={styles.instructionText}>
              Show the QR code to the cashier at checkout
            </Text>
          </View>

          <View style={styles.instructionItem}>
            <Text style={styles.instructionNumber}>2.</Text>
            <Text style={styles.instructionText}>
              Earn points on every purchase
            </Text>
          </View>

          <View style={styles.instructionItem}>
            <Text style={styles.instructionNumber}>3.</Text>
            <Text style={styles.instructionText}>
              Redeem points for exclusive rewards
            </Text>
          </View>

          <View style={styles.tipBox}>
            <Text style={styles.tipText}>
              💡 Tip: Download the LoyaltyHub app for real-time point tracking
              and exclusive mobile-only rewards!
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
