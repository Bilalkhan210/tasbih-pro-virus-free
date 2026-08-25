import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TouchableOpacity,
  Platform,
  Linking,
  Share,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../assets/color';
import { FONT, FONT_WEIGHT } from '../constants/typography';
import { useAppDirection } from '../hooks/useAppDirection';
import LocalizedText from '../components/LocalizedText';

const ProfileMenu = ({ visible, onClose }) => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { isRTL, rowDirection, textStyle } = useAppDirection();

  const menuItems = [
    {
      id: 'counterList',
      label: t('profileMenu.counterList'),
      icon: 'list-outline',
      type: 'tab',
      screen: 'Tasbih',
    },
    {
      id: 'settings',
      label: t('profileMenu.settings'),
      icon: 'settings-outline',
      type: 'stack',
      screen: 'Settings',
    },
    {
      id: 'language',
      label: t('profileMenu.changeLanguage'),
      icon: 'language-outline',
      type: 'stack',
      screen: 'ChangeLanguage',
    },
    {
      id: 'rate',
      label: t('profileMenu.rateUs'),
      icon: 'thumbs-up-outline',
      type: 'rate',
    },
    {
      id: 'share',
      label: t('profileMenu.shareApp'),
      icon: 'share-social-outline',
      type: 'share',
    },
  ];

  const handleItemPress = async (item) => {
    onClose();

    if (item.type === 'tab') {
      navigation.navigate(item.screen);
      return;
    }

    if (item.type === 'stack') {
      navigation.getParent()?.navigate(item.screen);
      return;
    }

    if (item.type === 'rate') {
      const url = Platform.select({
        ios: 'https://apps.apple.com',
        android: 'market://details?id=com.noortasbih',
      });
      try {
        await Linking.openURL(url);
      } catch {
        // Ignore if store link is unavailable.
      }
      return;
    }

    if (item.type === 'share') {
      try {
        await Share.share({
          message: t('profileMenu.shareMessage'),
        });
      } catch {
        // Ignore if share sheet is dismissed.
      }
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={[styles.overlay, isRTL && styles.overlayRtl]} onPress={onClose}>
        <View style={styles.card} onStartShouldSetResponder={() => true}>
          <LocalizedText style={[styles.header, textStyle]}>
            {t('profileMenu.title')}
          </LocalizedText>
          {menuItems.map((item, index) => (
            <View key={item.id}>
              {index > 0 ? <View style={styles.divider} /> : null}
              <TouchableOpacity
                style={[styles.menuItem, { flexDirection: rowDirection }]}
                onPress={() => handleItemPress(item)}
                activeOpacity={0.7}
              >
                <Ionicons name={item.icon} size={22} color={COLORS.gray} />
                <LocalizedText style={[styles.menuItemText, textStyle]}>
                  {item.label}
                </LocalizedText>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
};

export default ProfileMenu;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.08)',
    paddingTop: 56,
    paddingRight: 16,
    alignItems: 'flex-end',
  },
  overlayRtl: {
    paddingRight: 0,
    paddingLeft: 16,
    alignItems: 'flex-start',
  },
  card: {
    width: 248,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  header: {
    fontSize: FONT.sm,
    fontWeight: FONT_WEIGHT.medium,
    color: '#111111',
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 10,
  },
  menuItem: {
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  menuItemText: {
    flex: 1,
    fontSize: FONT.body,
    fontWeight: FONT_WEIGHT.medium,
    color: '#111111',
  },
  divider: {
    height: 1,
    backgroundColor: '#ECECEC',
    marginHorizontal: 18,
  },
});
