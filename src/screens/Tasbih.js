import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../assets/color';
import { BG_IMAGE_OPACITY } from '../constants/theme';
import { FONT, FONT_WEIGHT } from '../constants/typography';
import { useCounter } from '../context/CounterContext';
import CreateCounterSheet from '../components/CreateCounterSheet';
import { useAppDirection } from '../hooks/useAppDirection';
import LocalizedText from '../components/LocalizedText';

const Tasbih = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { textStyle, isRTL, rowDirection } = useAppDirection();
  const insets = useSafeAreaInsets();
  const {
    allCounters,
    selectCounter,
    addCustomCounter,
    updateCounter,
    deleteCounter,
  } = useCounter();
  const [sheetVisible, setSheetVisible] = useState(false);
  const [editingCounter, setEditingCounter] = useState(null);

  const openCounter = (counter) => {
    selectCounter(counter);
    navigation.navigate('Home');
  };

  const closeSheet = () => {
    setSheetVisible(false);
    setEditingCounter(null);
  };

  const openCreateSheet = () => {
    setEditingCounter(null);
    setSheetVisible(true);
  };

  const openEditSheet = (counter) => {
    setEditingCounter(counter);
    setSheetVisible(true);
  };

  const confirmDeleteCounter = (counter) => {
    Alert.alert(
      t('tasbih.deleteTitle'),
      t('tasbih.deleteMessage', { name: counter.label }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => deleteCounter(counter.id),
        },
      ],
    );
  };

  const handleSaveCounter = ({ id, label, initialCount, target }) => {
    if (id) {
      updateCounter(id, { label, initialCount, target });
    } else {
      addCustomCounter({ label, initialCount, target });
      navigation.navigate('Home');
    }
    closeSheet();
  };

  return (
    <ImageBackground
      source={require('../assets/images/bg.png')}
      style={styles.root}
      imageStyle={styles.bgImage}
      resizeMode="cover"
    >
      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + 12,
            paddingBottom: insets.bottom + 175,
          },
        ]}
      >
        <View style={styles.topBar}>
          <View style={styles.topBarSide} />
          <LocalizedText center style={styles.title}>
            {t('tasbih.title')}
          </LocalizedText>
          <TouchableOpacity
            style={styles.addButton}
            onPress={openCreateSheet}
            activeOpacity={0.85}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="add" size={22} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        <LocalizedText center style={styles.subtitle}>
          {t('tasbih.subtitle')}
        </LocalizedText>

        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {allCounters.map((item) => (
            <View
              key={item.id}
              style={[styles.card, isRTL && styles.cardRtl]}
            >
              <TouchableOpacity
                style={[
                  styles.cardMain,
                  { flexDirection: rowDirection },
                ]}
                onPress={() => openCounter(item)}
                activeOpacity={0.85}
              >
                <View style={[styles.cardText, isRTL && styles.cardTextRtl]}>
                  <Text style={[styles.cardLabel, textStyle]}>{item.label}</Text>
                  <Text style={[styles.cardTarget, textStyle]}>
                    {t('tasbih.lapLimit', { count: item.target })}
                  </Text>
                </View>
              </TouchableOpacity>
              <View style={[styles.cardActions, isRTL && styles.cardActionsRtl]}>
                <TouchableOpacity
                  onPress={() => openEditSheet(item)}
                  style={styles.cardActionButton}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="pencil" size={18} color={COLORS.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => confirmDeleteCounter(item)}
                  style={styles.cardActionButton}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash-outline" size={18} color="#C0392B" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>

      <CreateCounterSheet
        visible={sheetVisible}
        onClose={closeSheet}
        onSave={handleSaveCounter}
        counter={editingCounter}
      />
    </ImageBackground>
  );
};

export default Tasbih;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.offWhite,
  },
  bgImage: {
    opacity: BG_IMAGE_OPACITY,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    zIndex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  topBarSide: {
    width: 36,
    height: 36,
  },
  title: {
    flex: 1,
    fontSize: FONT.xl,
    fontWeight: FONT_WEIGHT.bold,
    color: '#111111',
  },
  subtitle: {
    fontSize: FONT.sm,
    color: '#5C6B5E',
    marginBottom: 18,
  },
  list: {
    flex: 1,
  },
  listContent: {
    gap: 12,
    paddingBottom: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    paddingLeft: 16,
    paddingRight: 8,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(71,127,78,0.12)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardRtl: {
    flexDirection: 'row-reverse',
    paddingLeft: 8,
    paddingRight: 16,
  },
  cardMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 4,
  },
  cardText: {
    flex: 1,
    alignSelf: 'stretch',
  },
  cardTextRtl: {
    alignItems: 'flex-end',
  },
  cardLabel: {
    fontSize: FONT.body,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.primaryDark,
    marginBottom: 4,
    alignSelf: 'stretch',
  },
  cardArabic: {
    fontSize: FONT.lg,
    color: '#1A1A1A',
    marginBottom: 4,
    lineHeight: FONT.lg + 6,
    writingDirection: 'rtl',
    alignSelf: 'stretch',
  },
  cardTarget: {
    fontSize: FONT.caption,
    color: '#7A9A7D',
    fontWeight: FONT_WEIGHT.medium,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(71,127,78,0.12)',
    paddingLeft: 4,
  },
  cardActionsRtl: {
    borderLeftWidth: 0,
    borderRightWidth: 1,
    borderRightColor: 'rgba(71,127,78,0.12)',
    paddingLeft: 0,
    paddingRight: 4,
  },
  cardActionButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primaryDark,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
});
