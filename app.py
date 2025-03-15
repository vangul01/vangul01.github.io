# To run: flask --app app.py --debug run
import os
from flask import Flask, jsonify, request, render_template
import stripe
import csv

app = Flask(__name__)

# Set your Stripe secret key (use environment variables for security in production)
stripe.api_key = os.getenv('SECRET_KEY')  # Replace with your actual Stripe secret key

# Function to load products from CSV
def load_products():
    products = []
    with open('products.csv', newline='') as csvfile:
        reader = csv.DictReader(csvfile)

        for row in reader:
            # Convert price to integer for easier calculations
            # row['priceX100'] = int(row['priceX100'])
            products.append(row)
    return products

# Load product data once at startup
products = load_products()

# Route to serve a simple HTML page
@app.route('/')
def index():
    return render_template('product.html')  # We'll create this template below
@app.route('/product/<int:product_id>')
def product_page(product_id):
    # Find the product by ID
    product = next((p for p in products if int(p['productID']) == product_id), None)
    if product is None:
        return "Product not found", 404
    return render_template('product.html', product=product)

# Endpoint to create a checkout session
@app.route('/create-checkout-session', methods=['POST'])
def create_checkout_session():
    try:
        # Create a Stripe Checkout session
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],  # Payment method
            line_items=[
                {
                    'price_data': {
                        'currency': 'usd',
                        'product_data': {
                            'name': 'Awesome Product',  # Product name
                        },
                        'unit_amount': 2000,  # Price in cents ($20.00)
                    },
                    'quantity': 1,
                },
            ],
            mode='payment',  # One-time payment
            success_url= 'http://localhost:5000/success',  # Replace with your success page
            cancel_url= 'http://localhost:5000/cancel',   # Replace with your cancel page
        )
        return jsonify({'id': session.id})
    except Exception as e:
        return jsonify(error=str(e)), 403

# Success and Cancel Routes
@app.route('/success')
def success():
    return 'Payment was successful!'

@app.route('/cancel')
def cancel():
    return 'Payment was cancelled.'

if __name__ == '__main__':
    app.run(port=5000, debug=True)

