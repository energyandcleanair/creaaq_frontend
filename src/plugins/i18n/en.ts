export default {
  $vuetify: require('vuetify/src/locale/en').default,

  brand_name: 'CREA',
  email: 'Email',
  name: 'Name',
  first_name: 'First name',
  last_name: 'Last name',
  password: 'Password',
  new_password: 'New Password',
  confirm_password: 'Confirm Password',
  close: 'Close',
  code: 'Code',
  confirm: 'Confirm',
  id: 'ID',
  type: 'Type',
  ok: 'Ok',
  yes: 'Yes',
  no: 'No',
  back: 'Back',
  cancel: 'Cancel',
  submit: 'Submit',
  advanced: 'Advanced',
  update_and_reload_page: 'Update and reload page',
  details: 'Details',
  period: 'Period',
  all: 'All',
  none: 'None',
  level: 'Level',
  basemap: 'Basemap',
  satellite: 'Satellite',
  terrain: 'Terrain',
  map: 'Map',
  download: 'Download',
  success: 'Success',
  fail: 'Fail',
  save: 'Save',
  delete: 'Delete',
  edit: 'Edit',
  show: 'Show',
  hide: 'Hide',
  from: 'From',
  to: 'To',
  or: 'Or',
  year: 'Year',
  others: 'Others',
  language: 'Language',
  measurement: 'Measurement',
  measurements: 'Measurements',
  violation: 'Violation',
  violations: 'Violations',
  trajectories: 'Trajectories',
  station: 'Station',
  stations: 'Stations',
  country: 'County',
  countries: 'Countries',
  value: 'Value',
  values: 'Values',
  region: 'Region',
  regions: 'Regions',
  city: 'City',
  cities: 'Cities',
  source: 'Source',
  sources: 'Sources',
  pollutant: 'Pollutant',
  pollutants: 'Pollutants',
  target: 'Target',
  targets: 'Targets',
  guideline: 'Guideline',
  guidelines: 'Guidelines',
  regulation: 'Regulation',
  regulations: 'Regulations',
  organization: 'Organization',
  organizations: 'Organizations',
  select_all: 'Select all',
  deselect_all: 'Deselect all',
  display_mode: 'Display mode',
  normal: 'Normal',
  last_updated: 'Last updated',
  superimposed_years: 'Superimposed years',
  clear_cache: 'Clear cache',
  refresh: 'Refresh',
  display_parameters_panel: 'Display parameters panel',
  running_average: 'Running average',
  averaging: 'Averaging',
  date: 'Date',
  dates: 'Dates',
  chart_size: 'Chart size',
  chart_columns: 'Chart columns',
  profile: 'Profile',
  help_n_support: 'Help & Support',
  attribution: 'Attribution',
  format: 'Format',
  export: 'Export',
  export_to_csv: 'Export to CSV',
  primary_filter: 'Primary filter',
  secondary_filter: 'Secondary filter',
  search_by_moving_map: 'Search by moving the map',
  go_to_measurements: 'Go to measurements',
  overshooting: 'Overshooting',
  target_value: 'Target value',
  unit: 'Unit',
  copy_query_url: 'Copy Query URL',
  exceptions_allowed: 'Exceptions allowed',
  average_so_far_this_year: 'Average so far this year',
  estimated_average_so_far_this_year:
    'Estimated level based on previous year trends and scaled with current year data.',
  auto_refresh: 'Auto refresh',
  auto_refresh_on_query_change: 'Auto refresh on query change',

  msg: {
    will_be_added_soon: 'Will be added soon. | {title} Will be added soon.',
    something_went_wrong: 'Something went wrong',
    required_field: 'Required field',
    unsupported_value: 'Unsupported value',
    unsupported_symbols: 'Unsupported symbols: {symbols}',
    must_have_num_chars: 'Must have at least {num} characters',
    must_be_less_num_chars: 'Must be less than {num} characters',
    must_have_num_items:
      'Must have at least {num} item | Must have at least {num} items',
    maximum_character_limit_exceeded: 'Maximum character limit exceeded',
    end_cannot_be_before_start: 'End cannot be before start',
    invalid: 'Invalid',
    not_authenticated: 'Not authenticated',
    not_found: 'Not found',
    no_data: 'No data',
    forbidden: 'Forbidden',
    no_items_found: 'No items found',
    invalid_item: 'Invalid {item}',
    passwords_dont_match: 'Passwords do not match',
    sign_up_success: 'You have successfully registered and logged in.',
    type_to_search: 'Type to search',
    no_results_found: 'No results found',
    limit_exceeded__server_cannot_process_amount__reduce_query:
      'The limit is exceeded. The server cannot process such a large request. Please reduce the amount of data requested.',
    limit_exceeded__platform_cannot_display__you_can_download_data_by_url:
      'The limit is exceeded. The platform cannot display such a large request. Please reduce the amount of data requested or download the data directly from the API.',
    too_large_url: 'Too large URL',
    too_large_query: 'Too large query',
    queried_of_limit: 'Queried {queried} with the limit of {limit}',
    loaded_of_limit: 'Loaded {loaded} with the limit of {limit}',
    rendering_n_items: 'Rendering {n} items',
    no_items_selected: 'No {items} selected',
    overshooting_tooltip_info: `Overshooting date is the date when a yearly target is exceeded even if air pollution dropped to zero from that day onwards.<br/><br/>Estimated overshooting dates (striped) are assuming similar trends than the previous year, scaled with current year data.`,
    cache_has_been_cleared: 'Cache has been cleared',
    query_url_copied_to_clipboard: 'Query URL copied to clipboard',
    new_app_version_available: 'The new app version is available.',
  },

  auth: {
    login: 'Login',
    login_with_google: 'Login with Google',
    create_account: 'Create an account',
    sign_in: 'Sign in',
    sign_up: 'Sign up',
    sign_out: 'Log out',
    reset_password: 'Reset password',
    update_password: 'Update password',
    change_password: 'Change password',
    set_new_password: 'Set a new password',
    forgot_password_question: 'Forgot password?',
    dont_have_account_question: "Don't have an account yet?",
    already_have_account_question: 'Already have an account?',
    reset_password_done_instruction:
      'To complete the password reset, open the link supplied in the message sent to the specified email',
    email_wasnt_set_for_user: "Email wasn't set for the user",
    password_successfully_changed: 'Password successfully changed',
  },

  dates_interval: {
    title: 'Dates interval',
    this_year: 'This year',
    last_n_years: 'Last {n} years',
    all: 'All',
    custom: 'Custom',
    from_x_to_y: '<i>from</i> <b>{x}</b> <i>to</i> <b>{y}</b>',
    from: 'From',
    to: 'To',
  },
}
