import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../assets/color';
import { BG_IMAGE_OPACITY } from '../constants/theme';
import { FONT, FONT_WEIGHT } from '../constants/typography';
import { useSettings } from '../context/SettingsContext';
import { useAppDirection } from '../hooks/useAppDirection';
import {
  LANGUAGE_OPTIONS,
  normalizeLanguageCode,
} from '../utils/language';
import LocalizedText from '../components/LocalizedText';

const ChangeLanguage = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { settings, updateSetting } = useSettings();
  const { backIcon, isRTL, centerTextStyle, textStyle } = useAppDirection();
  const activeLanguage = normalizeLanguageCode(settings.language);

  const handleSelect = (code) => {
    if (code === activeLanguage) {
      return;
    }
    updateSetting('language', code);
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
            paddingTop: insets.top + 8,
            paddingBottom: insets.bottom + 16,
          },
        ]}
      >
        <View style={[styles.topBar, isRTL && styles.topBarRtl]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name={backIcon} size={24} color="#111111" />
          </TouchableOpacity>
          <LocalizedText center style={styles.screenTitle}>
            {t('languages.changeLanguage')}
          </LocalizedText>
          <View style={styles.backButton} />
        </View>

        <LocalizedText center style={styles.subtitle}>
          {t('languages.selectLanguage')}
        </LocalizedText>

        <View style={styles.card}>
          {LANGUAGE_OPTIONS.map((item, index) => {
            const selected = item.code === activeLanguage;
            return (
              <View key={item.code}>
                {index > 0 ? <View style={styles.divider} /> : null}
                <TouchableOpacity
                  style={[styles.row, isRTL && styles.rowRtl]}
                  onPress={() => handleSelect(item.code)}
                  activeOpacity={0.8}
                >
                  <View style={styles.labelWrap}>
                    <Text style={[styles.nativeName, centerTextStyle]}>
                      {item.nativeName}
                    </Text>
                    <LocalizedText style={[styles.translatedName, textStyle]}>
                      {t(item.labelKey)}
                    </LocalizedText>
                  </View>
                  {selected ? (
                    <Ionicons
                      name="checkmark-circle"
                      size={22}
                      color={COLORS.primary}
                    />
                  ) : (
                    <View style={styles.checkPlaceholder} />
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </View>
    </ImageBackground>
  );
};

export default ChangeLanguage;

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
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  topBarRtl: {
    flexDirection: 'row-reverse',
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenTitle: {
    fontSize: FONT.xl,
    fontWeight: FONT_WEIGHT.bold,
    color: '#111111',
    flex: 1,
  },
  subtitle: {
    fontSize: FONT.sm,
    color: '#6B7280',
    marginBottom: 16,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(71,127,78,0.12)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  rowRtl: {
    flexDirection: 'row-reverse',
  },
  labelWrap: {
    flex: 1,
    gap: 2,
  },
  nativeName: {
    fontSize: FONT.body,
    fontWeight: FONT_WEIGHT.semibold,
    color: '#111111',
  },
  translatedName: {
    fontSize: FONT.caption,
    color: COLORS.gray,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 18,
  },
  checkPlaceholder: {
    width: 22,
    height: 22,
  },
});
