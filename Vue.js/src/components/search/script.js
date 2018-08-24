import { VueAutosuggest } from "vue-autosuggest";
export default {
  components: {
    VueAutosuggest
  },
  name:"searchComp",
  data() {
    return {
      selected: "",
      filteredOptions: [],
      suggestions: [
        {
          data: [
            { id: 1, name: "Sony A7 s4 sijith chandran ", avatar: "https://www.newsshooter.com/wp-content/uploads/2016/09/Tokina-16-28mm-II-T3-Cinema-Zoom-600x404.jpg" },
            { id: 2, name: "Samwise", avatar: "https://www.newsshooter.com/wp-content/uploads/2016/09/Tokina-16-28mm-II-T3-Cinema-Zoom-600x404.jpg" },
            { id: 3, name: "Gandalf", avatar: "https://www.newsshooter.com/wp-content/uploads/2016/09/Tokina-16-28mm-II-T3-Cinema-Zoom-600x404.jpg" },
            { id: 1, name: "Frodo", avatar: "https://www.newsshooter.com/wp-content/uploads/2016/09/Tokina-16-28mm-II-T3-Cinema-Zoom-600x404.jpg" },
            { id: 2, name: "Samwise", avatar: "./samwise.jpg" },
            { id: 3, name: "Gandalf", avatar: "./gandalf.png" },
            { id: 1, name: "Frodo", avatar: "./frodo.jpg" },
            { id: 2, name: "Samwise", avatar: "./samwise.jpg" },
            { id: 3, name: "Gandalf", avatar: "./gandalf.png" },
            { id: 1, name: "Frodo", avatar: "./frodo.jpg" },
            { id: 2, name: "Samwise", avatar: "./samwise.jpg" },
            { id: 3, name: "Gandalf", avatar: "./gandalf.png" },
            { id: 1, name: "Frodo", avatar: "./frodo.jpg" },
            { id: 2, name: "Samwise", avatar: "./samwise.jpg" },
            { id: 3, name: "Gandalf", avatar: "./gandalf.png" },
            { id: 1, name: "Frodo", avatar: "./frodo.jpg" },
            { id: 2, name: "Samwise", avatar: "./samwise.jpg" },
            { id: 3, name: "Gandalf", avatar: "./gandalf.png" },
            { id: 1, name: "Frodo", avatar: "https://www.newsshooter.com/wp-content/uploads/2016/09/Tokina-16-28mm-II-T3-Cinema-Zoom-600x404.jpg" },
            { id: 2, name: "Samwise", avatar: "./samwise.jpg" },
            { id: 3, name: "Gandalf", avatar: "./gandalf.png" },
            { id: 4, name: "Aragorn", avatar: "./aragorn.jpg" },
            { id: 2, name: "Samwise", avatar: "./samwise.jpg" },
            { id: 3, name: "Gandalf", avatar: "./gandalf.png" },
            { id: 1, name: "Frodo", avatar: "./frodo.jpg" },
            { id: 2, name: "Samwise", avatar: "./samwise.jpg" },
            { id: 3, name: "Gandalf", avatar: "./gandalf.png" },
            { id: 1, name: "Frodo", avatar: "./frodo.jpg" },
            { id: 2, name: "Samwise", avatar: "./samwise.jpg" },
            { id: 3, name: "Gandalf", avatar: "https://www.newsshooter.com/wp-content/uploads/2016/09/Tokina-16-28mm-II-T3-Cinema-Zoom-600x404.jpg" },
            { id: 1, name: "Frodo", avatar: "./frodo.jpg" },
            { id: 2, name: "Samwise", avatar: "https://www.newsshooter.com/wp-content/uploads/2016/09/Tokina-16-28mm-II-T3-Cinema-Zoom-600x404.jpg" },
            { id: 3, name: "Gandalf", avatar: "./gandalf.png" },
            { id: 1, name: "Frodo", avatar: "https://www.newsshooter.com/wp-content/uploads/2016/09/Tokina-16-28mm-II-T3-Cinema-Zoom-600x404.jpg" },
            { id: 2, name: "Samwise", avatar: "https://www.newsshooter.com/wp-content/uploads/2016/09/Tokina-16-28mm-II-T3-Cinema-Zoom-600x404.jpg" },
            { id: 3, name: "Gandalf", avatar: "./gandalf.png" },
            { id: 1, name: "Frodo", avatar: "./frodo.jpg" },
            { id: 2, name: "Samwise", avatar: "./samwise.jpg" },
            { id: 3, name: "Gandalf", avatar: "./gandalf.png" },
            { id: 1, name: "Frodo", avatar: "./frodo.jpg" },
            { id: 2, name: "Samwise", avatar: "./samwise.jpg" },
            { id: 3, name: "Gandalf", avatar: "./gandalf.png" },
            { id: 4, name: "Aragorn", avatar: "./aragorn.jpg" }
          ]
        }
      ]
    };
  },
  methods: {
    onInputChange(text, oldText) {
      if (text === null) {

       console.log(oldText);
        return;
      }
 
      const filteredData = this.suggestions[0].data.filter(option => {
        return option.name.toLowerCase().indexOf(text.toLowerCase()) > -1;
      });
 
      this.filteredOptions = [{ data: filteredData }];
    },
    clickHandler(item){
      console.log("clicked"+item);
    },
    onSelected(item) {
      this.selected = item;
    },
    renderSuggestion(suggestion) {
      const character = suggestion.item;
      return (
        <div
          class="imageWrap"
          style={{
            backgroundImage: "url(" + character.avatar + ")"
          }}
        >
          <span style={{ color: "navyblue" }}>{character.name}</span>
        </div>
      );
    },

    getSuggestionValue(suggestion) {
      return suggestion.item.name;
    },
    focusMe(e) {
      console.log(e)
    }
  }
};
