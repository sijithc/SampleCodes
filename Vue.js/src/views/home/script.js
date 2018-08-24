import searchComp from "@/components/search/search.vue";
import accountInfo from "@/components/account/account.vue";
export default {
  data() {
    return {
      initialize: false,
      dialogVisible: false,
      searchKeyword: "Javascript",
      searchElmWidth: 50
    };
  },

  name: "home",
  components: {
    searchComp,
    accountInfo
  }
};
