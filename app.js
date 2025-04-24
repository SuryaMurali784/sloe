<script>
// Initialize Firebase (replace with your config)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let loggedInUser = null;

function handleLogin(event) {
  event.preventDefault();
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  firebase.auth().signInWithEmailAndPassword(email, password)
    .then(userCredential => {
      const user = userCredential.user;
      if (!user.emailVerified) {
        alert("Please verify your email before logging in.");
        firebase.auth().signOut();
        return;
      }
      loggedInUser = { email: user.email, uid: user.uid };
      alert("Logged in successfully!");
      document.getElementById("login-section").classList.add("hidden");
      showDashboard();
    })
    .catch(error => {
      alert("Login Error: " + error.message);
    });
}

function handleSignup(event) {
  event.preventDefault();
  const email = document.getElementById("signup-email").value;
  const password = document.getElementById("signup-password").value;
  const username = document.getElementById("signup-username").value;

  firebase.auth().createUserWithEmailAndPassword(email, password)
    .then(userCredential => {
      const user = userCredential.user;
      return user.updateProfile({ displayName: username }).then(() => {
        return user.sendEmailVerification();
      });
    })
    .then(() => {
      alert("Account created! Please verify your email.");
      showLogin();
    })
    .catch(error => {
      alert("Signup Error: " + error.message);
    });
}

function sendPasswordReset() {
  const email = prompt("Enter your email for password reset:");
  if (email) {
    firebase.auth().sendPasswordResetEmail(email)
      .then(() => alert("Password reset link sent!"))
      .catch(error => alert("Reset Error: " + error.message));
  }
}

firebase.auth().onAuthStateChanged(user => {
  if (user && user.emailVerified) {
    loggedInUser = { email: user.email, uid: user.uid };
    showDashboard();
  } else {
    loggedInUser = null;
  }
});

function showDashboard() {
  console.log("Welcome", loggedInUser);
  // Reveal dashboard or main app
}

function checkout() {
  if (!loggedInUser) {
    alert("Please login to checkout.");
    return;
  }

  if (cart.length === 0) {
    alert("Your cart is empty.");
    return;
  }

  showPaymentModal();
}

function showPaymentModal() {
  const modal = document.createElement("div");
  modal.innerHTML = `
    <div class='fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50'>
      <div class='bg-white dark:bg-gray-900 p-6 rounded shadow-xl w-80 animate-fade-in'>
        <h3 class='text-xl font-semibold mb-4'>💳 Enter Payment Info</h3>
        <input placeholder="Card Number" class="w-full p-2 mb-2 border rounded" />
        <input placeholder="Expiry Date" class="w-full p-2 mb-2 border rounded" />
        <input placeholder="CVV" class="w-full p-2 mb-4 border rounded" />
        <button onclick="processPayment(this)" class="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Pay Now</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

function processPayment(button) {
  button.disabled = true;
  button.innerText = "Processing...";
  setTimeout(() => {
    document.querySelector(".fixed.inset-0").remove();
    finalizeOrder();
  }, 2000);
}

function finalizeOrder() {
  const order = {
    id: Date.now(),
    items: [...cart],
    total: cart.reduce((sum, item) => sum + item.price, 0),
    date: new Date().toLocaleString(),
    user: loggedInUser.email
  };

  db.collection("orders").add(order).then(() => {
    cart = [];
    cartItems.innerHTML = "<p class='text-green-600 font-semibold'>Order placed successfully!</p>";
    cartCounter.innerText = 0;
    launchConfetti();
    showOrderConfirmation();
    fetchUserOrders();
  });
}

function showOrderConfirmation() {
  const confirmation = document.createElement("div");
  confirmation.innerHTML = `
    <div class='fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50'>
      <div class='bg-white dark:bg-gray-900 text-center p-6 rounded shadow-xl animate-fade-in'>
        <h2 class='text-2xl font-bold mb-2'>🎉 Thank you for your purchase!</h2>
        <p>Your order has been confirmed.</p>
        <button onclick="this.parentElement.parentElement.remove()" class="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">Close</button>
      </div>
    </div>
  `;
  document.body.appendChild(confirmation);
}

function fetchUserOrders() {
  if (!loggedInUser) return;

  db.collection("orders")
    .where("user", "==", loggedInUser.email)
    .orderBy("date", "desc")
    .get()
    .then(snapshot => {
      const orders = snapshot.docs.map(doc => doc.data());
      renderUserDashboard(orders);
    });
}

function renderUserDashboard(orders = []) {
  const dashboard = document.querySelector("#user-dashboard");
  if (!dashboard) return;

  dashboard.innerHTML = `<h2 class='text-xl font-bold mb-4'>📦 Your Orders</h2>`;

  if (orders.length === 0) {
    dashboard.innerHTML += `<p class='text-gray-600'>You haven't placed any orders yet.</p>`;
    return;
  }

  orders.forEach(order => {
    dashboard.innerHTML += `
      <div class='dashboard-order-card'>
        <p class='text-sm text-gray-500'>${order.date}</p>
        <p class='font-semibold'>${order.items.length} item(s) - $${order.total.toFixed(2)}</p>
        <ul class='text-xs mt-2'>
          ${order.items.map(item => `<li>• ${item.name}</li>`).join('')}
        </ul>
      </div>
    ;
  });
}
</script>
