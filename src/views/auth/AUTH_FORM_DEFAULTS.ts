import i18n from '@/plugins/i18n'

const PASSWORD_LENGTH_MIN = 6
const NAME_LENGTH_MAX = 64
const EMAIL_REG = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

/**
 * This is the object with props for inputs of the auth form.
 * Just to don't copy the props to each view.
 */
export default {
  name: {
    label: i18n.t('name'),
    rules: [
      (v: string) => !!v || i18n.t('msg.required_field'),
      (v: string) => {
        return (
          (v && v.length < NAME_LENGTH_MAX) ||
          i18n.t('msg.maximum_character_limit_exceeded')
        )
      },
    ],
  },
  email: {
    label: i18n.t('email'),
    rules: [
      (v: string) => !!v || i18n.t('msg.required_field'),
      (v: string) =>
        EMAIL_REG.test(v) ||
        i18n.t('msg.invalid_item', {item: i18n.t('email')}),
    ],
  },
  password: {
    label: i18n.t('password'),
    rules: [
      (v: string) => !!v || i18n.t('msg.required_field'),
      (v: string) => {
        return (
          (v && v.length >= PASSWORD_LENGTH_MIN) ||
          i18n.t('msg.must_have_num_chars', {num: PASSWORD_LENGTH_MIN})
        )
      },
    ],
  },
  passwordConfirm: {
    label: i18n.t('confirm_password'),
    rules: [(v: string) => !!v || i18n.t('msg.required_field')],
  },
  code: {
    label: i18n.t('code'),
    rules: [(v: string) => !!v || i18n.t('msg.required_field')],
  },
}
