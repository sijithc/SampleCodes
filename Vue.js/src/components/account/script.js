export default {
  data() {
    return {
      login: true,
      accountDropdown: false
    };
  },

  name: "accountInfo",
  methods: {
    showAccountDetails() {
      if (this.accountDropdown == true) {
        this.accountDropdown = false;
      } else {
        this.accountDropdown = true;
      }
    }
  }
};
