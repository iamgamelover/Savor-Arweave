const BadWordsArray = require('./badWords.json').words;

class BadWords {
  static sorted:boolean = false;

  static sort() {
    if(BadWords.sorted) return;
    BadWordsArray.sort((a:string, b:string)=>{
      if(a.length > b.length)
        return -1;
      else if(a.length < b.length)
        return 1;
      return -0;
    });
    BadWords.sorted = true;
  }

  static isBad(s:string):boolean {
    BadWords.sort();
    for(let i = 0; i < BadWordsArray.length; i++) 
      if(s.indexOf(BadWordsArray[i]) != -1) 
        return true;
    return false;
  }

  static clean(s:string):string {
    BadWords.sort();

    let cleaned = s;

    let stripped = s.toLowerCase();
    let matches = stripped.match(/<\/?("[^"]*"|'[^']*'|[^>])*(>|$)/g);
    if(matches) 
      for(let j = 0; j < matches.length; j++)
        stripped = stripped.replace(matches[j], '-'.repeat(matches[j].length));

    for(let i = 0; i < BadWordsArray.length; i++) {
      let bw = BadWordsArray[i];
      bw = bw.replaceAll('*', '\\*');
      let re = new RegExp('\\b' + bw + '\\b', 'g');
      let replacing = true;
      while(replacing) {
        let n = stripped.search(re);
        if(n != -1) {
          let bleep = '*'.repeat(BadWordsArray[i].length);
          cleaned = cleaned.substring(0, n) + bleep + cleaned.substring(n + bleep.length);
          stripped = stripped.substring(0, n) + bleep + stripped.substring(n + bleep.length);
        }
        replacing = (n != -1);
      }
    }
    
    return cleaned;
  }
}

export default BadWords;