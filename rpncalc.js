// Copyright (c) 2011, Christophe Juniet <[my first name]@[my family name].net>
//
// Permission to use, copy, modify, and/or distribute this software for any
// purpose with or without fee is hereby granted, provided that the above
// copyright notice and this permission notice appear in all copies.
//
// THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
// WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
// MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
// ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
// WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
// ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
// OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.

var isChrome = (navigator.userAgent.indexOf('Chrome/')>=0&&navigator.userAgent.indexOf('WebKit')>=0)?true:false;
var G, W, H, N, S;
var stack = [''];
var ustack = [''];
var mode = 10;
var blink = true;
var fg1, fg2, bg1, bg2;

function is_constant(c) {
  return c=='E'||c=='P';
}

function is_mode(c) {
  return c=='B'||c=='H'||c=='O';
}

function is_stack_op(c) {
  return c=='q'||c=='w'||c=='z';
}

function is_unary_op(c) {
  return c=='C'||c=='D'||c=='i'||c=='l'||c=='n'||c=='r'||c=='S'||c=='X';
}

function is_binary_op(c) {
  return c=='+'||c=='-'||c=='*'||c=='/'||c=='%'||c=='&'||c=='|'||c=='^'||c=='@';
}

function parseNumber(o) {
  if (typeof o == "number") return o;
  var s = o.toString();
  var len = s.length;
  if (s.indexOf('.') != -1) return parseFloat(s);
  if (s.charAt(0) == '0') {
    if (s.charAt(1) == 'x') return parseInt(s, 16);
    if (s.charAt(len-1) != 'b') return parseInt(s, 8);
  }
  if (s.charAt(len-1) == 'b') {
    s = s.substr(0, len-1);
    --len;
    var n = 0, d = 1;
    for (var i = 0; i < len; ++i) {
      if (s.charAt(len-1-i) == '1') n += d;
      d *= 2;
    }
    return n;
  }
  return parseInt(s);
}

function main() {
  log("loading...");
  var girly = (location.search.substr(1) == 'kitty');
  var screen = document.getElementById('screen');
  if (screen.getContext) {
    G = screen.getContext('2d');
    W = screen.width;
    H = screen.height;
    S = H / 10;
    N = H / S;
    G.font = S + 'px monospace';
    G.textAlign = "right";
    G.textBaseline = "bottom";
    fg1 = (girly?"#101010":"#607060");
    fg2 = (girly?"#878787":"#97A797");
    bg1 = (girly?"#ff99cc":"#d0e0d0");
    bg2 = (girly?"#ffffcc":"#e0f0e0");
    draw();
    window.setInterval("blinktimer()", 500);
    log("ready!");
  } else {
    log("canvas is not supported!");
  }
}

function ondirectkey(e, c) {
  if (c == '\n') {
    e.keyCode = 13;
  } else {
    e.charCode = c.charCodeAt(0);
  }
  onkey(e);
}

function onspecialkey(e) {
  if (isChrome && (e.keyCode == 8 || e.keyCode == 46)) onkey(e);
}

function onkey(e) {
  if (e.ctrlKey || e.altKey) return;
  var c = String.fromCharCode(e.charCode);

  if (c == 'u') {
    var tmp = stack;
    stack = ustack;
    ustack = tmp;
    e.preventDefault();
    e.cancelBubble = true;
    draw();
    return;
  }

  var ok = true;
  var s = stack[0].toString();
  var l = s.length;
  var n = stack.length;
  var oldstack = stack.slice(0, n);
  if (e.keyCode == 13) { // enter
    if (n >= N) {
      log("stack is full!");
    } else if (l != 0) {
      stack[0] = parseNumber(s);
      stack.unshift('');
    } else if (n > 1) {
      stack[0] = stack[1];
      stack.unshift('');
    }
  } else if (e.keyCode == 8) { // backspace
    if (l != 0) stack[0] = s.substring(0, l-1);
  } else if (e.keyCode == 46) { // delete
    if (l != 0) {
      stack[0] = '';
    } else if (n > 1) {
      stack.shift();
      stack[0] = '';
    }
  } else if (is_mode(c)) {
    if (c == 'B') mode = (mode ==  2 ? 10 :  2);
    if (c == 'H') mode = (mode == 16 ? 10 : 16);
    if (c == 'O') mode = (mode ==  8 ? 10 :  8);
    switch (mode) {
      case  2: log("binary mode"); break;
      case  8: log("octal mode"); break;
      case 10: log("decimal mode"); break;
      case 16: log("hexadecimal mode"); break;
    }
  } else if (is_constant(c)) {
    if (n >= N) {
      log("stack is full!");
    } else {
      var t = stack[0];
      if (c == 'E') {
        stack[0] = Math.E;
      } else if (c == 'P') {
        stack[0] = Math.PI;
      }
      stack.unshift(t);
    }
  } else if (is_stack_op(c)) {
    if (n > 2 || (n == 2 && l != 0)) {
      if (l == 0) stack.shift();
      if (c == 'q') {
        if (n > 1) stack.push(stack.shift());
      } else if (c == 'w') {
        if (n > 1) stack.unshift(stack.pop());
      } else if (c == 'z') {
        if (n > 1) {
          var t = stack[0];
          stack[0] = stack[1];
          stack[1] = t;
        }
      }
      stack.unshift('');
    }
  } else if (is_unary_op(c)) {
    if (l != 0 || n > 1) {
      var push_prompt = false;
      if (l == 0) {
        stack.shift();
        --n;
        push_prompt = true;
      }
      if (c == 'C') {
        stack.unshift(Math.cos(parseNumber(stack.shift())));
      } else if (c == 'D') {
        if (n >= N || (push_prompt && n >= (N-1))) {
          log("stack is full!");
        } else {
          stack.unshift(stack[0]);
        }
      } else if (c == 'i') {
        stack[0] = parseInt(stack[0]);
      } else if (c == 'l') {
        var a = parseNumber(stack.shift());
        if (a > 0) {
          stack.unshift(Math.log(a));
        } else {
          log("invalid argument!");
          push_prompt = true;
        }
      } else if (c == 'n') {
        stack.unshift(-parseNumber(stack.shift()));
      } else if (c == 'r') {
        var a = parseNumber(stack.shift());
        if (a > 0) {
          stack.unshift(Math.sqrt(a));
        } else {
          log("invalid argument!");
          push_prompt = true;
        }
      } else if (c == 'S') {
        stack.unshift(Math.sin(parseNumber(stack.shift())));
      } else if (c == 'X') {
        if (n > 0) {
          stack.shift();
          if (n == 1) push_prompt = true;
        }
      }
      if (push_prompt) stack.unshift('');
    }
  } else if (is_binary_op(c)) {
    if (n > 2 || (n == 2 && l != 0)) {
      if (l == 0) stack.shift();
      var b = parseNumber(stack.shift());
      var a = parseNumber(stack.shift());
      if (c == '+') {
        stack.unshift(a + b);
      } else if (c == '-') {
        stack.unshift(a - b);
      } else if (c == '*') {
        stack.unshift(a * b);
      } else if (c == '/') {
        if (b != 0) {
          stack.unshift(a / b);
        } else {
          log("division by zero!");
          stack.unshift(a);
          stack.unshift(b);
        }
      } else if (c == '%') {
        stack.unshift(a%b);
      } else if (c == '@') {
        stack.unshift(Math.pow(a, b));
      } else if (c == '&') {
        stack.unshift(a & b);
      } else if (c == '|') {
        stack.unshift(a | b);
      } else if (c == '^') {
        stack.unshift(a ^ b);
      }
      stack.unshift('');
    }
  } else if ((c >= '0' && c <= '9') || (c >= 'a' && c <= 'f') || c == 'x' || c == '.') {
    if (c == 'x') {
      if (s == '0') s = '0x';
    } else if (c >= 'a' && c <= 'f') {
      if (s.charAt(0) == '0' && s.charAt(1) == 'x') {
        s = s + c;
      } else if (c == 'b' && l != 0) {
        var good = true;
        for (var i = 0; good && i < l; ++i) {
          var p = s.charAt(i);
          if (p != '0' && p != '1') good = false;
        }
        if (good) s = s + c;
      }
    } else if (c == '.') {
      if (l == 0 || s == '0') {
        s = '0.';
      } else if (s.charAt(0) != '0') {
        var good = true;
        for (var i = 0; good && i < l; ++i) {
          var p = s.charAt(i);
          if (p < '0' || p > '9') good = false;
        }
        if (good) s = s + c;
      }
    } else { // digits (hex, oct, bin, dec)
      if (s.charAt(1) == 'x'
         || (s.charAt(0) == '0' && s.charAt(l-1) != 'b' && c < '8')
         || (s.charAt(0) != '0' && s.charAt(l-1) != 'b')
         || (s.charAt(0) == '0' && s.charAt(1) == '.'))
      {
        s = s + c;
      }
    }
    stack[0] = s;
  } else {
    ok = false;
  }

  if (ok) {
    ustack = oldstack;
    e.preventDefault();
    e.cancelBubble = true;
    draw();
  } else {
    stack = oldstack;
  }
}

function draw() {
  for (var i = 0; i < N; ++i) {
    G.fillStyle = (i % 2 ? bg1 : bg2);
    G.fillRect(0, i*S, W, (i+1)*S);
  }

  G.fillStyle = fg1;
  if (blink) G.fillRect(W-2, H-S, W, H);
  if (stack[0] != '') drawText(stack[0], 0);

  for (var i = 1; i < stack.length; i++) {
    G.fillStyle = fg1;
    var s = stack[i].toString();
    if (mode != 10) {
      if (s.indexOf('.') == -1) {
        var n = new Number(stack[i]);
        switch (mode) {
          case 2: s = n.toString(2)+'b'; break;
          case 8: s = '0' + n.toString(8); break;
          case 16: s = '0x' + n.toString(16).toUpperCase(); break;
        }
      } else {
        G.fillStyle = fg2;
      }
    }
    drawText(s, i);
  }
}

function drawText(s, i) {
  var z = S;
  while (z > 1 && G.measureText(s).width > W) {
    G.font = --z + 'px monospace';
  }
  G.fillText(s, W, H-S*i-(S-z)/2);
  G.font = S + 'px monospace';
}

function blinktimer() {
  blink = !blink;
  draw();
}

function log(msg) {
  var trace = document.getElementById("trace");
  var lines = trace.innerHTML;
  var v = lines.split('<br>');
  while (v.length == 3) { v[1] = v[2]; v.pop(); }
  var d = new Date();
  v.push('[' + d.toLocaleTimeString() + '] ' + msg);
  trace.innerHTML = v.join('<br>');
}
