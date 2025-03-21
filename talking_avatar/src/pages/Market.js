import React, { useState } from 'react';
import { db } from '../utils/firebaseConfig'; // Adjust path to your firebase config file
import { collection, doc, setDoc } from 'firebase/firestore';
// Importing icons from react-icons (install with: npm install react-icons)
import { FaShoppingCart, FaPlus, FaMinus, FaSearch, FaTimes } from 'react-icons/fa';

function DailyNeeds() {
    // Static list of 13 daily need items with sections, Indian Rupees, and updated images
    const initialProducts = [
        // Medical Items (Emergency Needs)
        {
            uid: 1,
            name: "Bandages (10 pcs)",
            price: 150,
            rating: 4.6,
            image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTsWFkK-qfy9L5e0TvH2OkpjqZH2E81CA3y3Q&s",
            section: "Medical"
        },
        {
            uid: 2,
            name: "Painkillers (10 tablets)",
            price: 50,
            rating: 4.5,
            image: "https://images.pexels.com/photos/208512/pexels-photo-208512.jpeg?auto=compress&cs=tinysrgb&w=300",
            section: "Medical"
        },
        {
            uid: 3,
            name: "Antiseptic Liquid (100ml)",
            price: 120,
            rating: 4.7,
            image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQp_LwGt5ZzRqFXihCcK8wpD6jf6flwLLNaWQ&s",
            section: "Medical"
        },
        {
            uid: 4,
            name: "Thermometer",
            price: 300,
            rating: 4.8,
            image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQOYq6pD-11NskH6tqgY-epMID8wkzRPJ0Nqw&s",
            section: "Medical"
        },
        {
            uid: 5,
            name: "Cotton Balls (50 pcs)",
            price: 80,
            rating: 4.4,
            image: "https://m.media-amazon.com/images/I/515BOxhi8TL.jpg",
            section: "Medical"
        },
        {
            uid: 6,
            name: "Face Mask (5 pcs)",
            price: 100,
            rating: 4.6,
            image: "https://images.pexels.com/photos/3873193/pexels-photo-3873193.jpeg?auto=compress&cs=tinysrgb&w=300",
            section: "Medical"
        },

        // Daily Need Items (Emergency Essentials)
        {
            uid: 7,
            name: "Adult Diapers",
            price: 30,
            rating: 4.5,
            image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQiXb3hjisihMLosX723WNFtVcJz5kKK_BboA&s",
            section: "Daily Needs"
        },
        {
            uid: 8,
            name: "Toothpaste",
            price: 60,
            rating: 4.6,
            image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRPtT6uTdKX_JE-uXaTBeCUDfdfUaHvQRThOgQt5xuvhy3InMrSwPjseb64TOLbb7bVKaM&usqp=CAU",
            section: "Daily Needs"
        },
        {
            uid: 9,
            name: "Toothbrush",
            price: 200,
            rating: 4.7,
            image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQop0AEhoDug6rgs7YwEElQyLAE0UolhCARCrlT_6efnywz6cHrpUCI2_nKSgq1XzV1IUY&usqp=CAU",
            section: "Daily Needs"
        },
        {
            uid: 10,
            name: "Adult wet wiper",
            price: 40,
            rating: 4.4,
            image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTMviTb7O3maDVvq1B3qr8XH8k6MKE2GgdZWA&s",
            section: "Daily Needs"
        },
        {
            uid: 11,
            name: "Hand Sanitizer",
            price: 80,
            rating: 4.5,
            image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR3FDLbCKsoau2qIvhz0golOVDCKKfiT_thSg&s",
            section: "Daily Needs"
        },
        {
            uid: 12,
            name: "Mosturizer",
            price: 50,
            rating: 4.3,
            image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTW2OVyQWlmP8tKwQXmUkq28CxTAdTwZ2ysZw&s",
            section: "Daily Needs"
        },

        // Food Items (Emergency Staples)
        {
            uid: 13,
            name: "Bread",
            price: 40,
            rating: 4.5,
            image: "https://images.pexels.com/photos/1775043/pexels-photo-1775043.jpeg?auto=compress&cs=tinysrgb&w=300",
            section: "Food"
        },
        {
            uid: 14,
            name: "Curd",
            price: 60,
            rating: 4.8,
            image: "https://static.ticimax.cloud/12549/uploads/urunresimleri/buyuk/peypa-gourmet-suzme-yogurt-500-gr-61ca.jpg",
            section: "Food"
        },
        {
            uid: 15,
            name: "Rice",
            price: 60,
            rating: 4.5,
            image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ4Sdt37Fx2-wB-KD0DetH1u2uFZ0s-Q89CUQ&s",
            section: "Food"
        },
        {
            uid: 16,
            name: "Eggs",
            price: 70,
            rating: 4.3,
            image: "https://images.pexels.com/photos/162712/egg-white-food-protein-162712.jpeg?auto=compress&cs=tinysrgb&w=300",
            section: "Food"
        },
        {
            uid: 17,
            name: "Apples",
            price: 30,
            rating: 4.4,
            image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT0CPJrRlkE17l2fTKihMv-wHjmNLfBnnHbFg&s",
            section: "Food"
        },
        {
            uid: 18,
            name: "Cooking Oil",
            price: 80,
            rating: 4.2,
            image: "https://hips.hearstapps.com/hmg-prod/images/gettyimages-1206682746.jpg?crop=0.6669811320754717xw:1xh;center,top&resize=640:*",
            section: "Food"
        },
    ];
    const [products] = useState(initialProducts);
    const [cart, setCart] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const userId = localStorage.getItem('userId');

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sections = [...new Set(products.map(p => p.section))];

    const addToCart = (product) => {
        const existingItem = cart.find(item => item.uid === product.uid);
        let updatedCart;
        if (existingItem) {
            updatedCart = cart.map(item =>
                item.uid === product.uid ? { ...item, quantity: item.quantity + 1 } : item
            );
        } else {
            updatedCart = [...cart, { ...product, quantity: 1, cartId: Date.now() }];
        }
        setCart(updatedCart);
    };

    const updateQuantity = (cartId, change) => {
        const updatedCart = cart.map(item => {
            if (item.cartId === cartId) {
                const newQuantity = item.quantity + change;
                return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
            }
            return item;
        }).filter(item => item !== null);
        setCart(updatedCart);
    };

    const calculateTotal = () => {
        return cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2);
    };

    const calculateTotalQuantity = () => {
        return cart.reduce((sum, item) => sum + item.quantity, 0);
    };

    const placeOrder = async () => {
        if (cart.length === 0) {
            alert('Your cart is empty!');
            return;
        }

        const confirmed = window.confirm(`Confirm your order? Total: ₹${calculateTotal()}`);
        if (!confirmed) return;

        setIsLoading(true);

        const orderData = {
            userId: userId || 'anonymous',
            ItemsBought: cart,
            time: new Date().toISOString(),
            isDelivered: false,
            total: calculateTotal(),
            total_qty: calculateTotalQuantity(),
            orderId: Date.now().toString(),
            createdAt: new Date().toISOString(),
        };

        try {
            const ordersCollection = collection(db, 'orders');
            await setDoc(doc(ordersCollection, orderData.orderId), orderData);
            setCart([]);
            alert(`Order placed successfully! Total: ₹${calculateTotal()}`);
        } catch (error) {
            console.error('Error placing order:', error);
            alert('Failed to place order. Please try again.');
        } finally {
            setIsLoading(false);
            setIsCartOpen(false);
        }
    };

    // Cart Modal Component
    const CartModal = () => (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-[#FFF5F5] p-8 rounded-xl w-11/12 max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-semibold text-[#5D4037]">Your Cart</h2>
                    <button
                        onClick={() => setIsCartOpen(false)}
                        className="text-3xl text-[#8D6E63] hover:text-[#5D4037]"
                    >
                        <FaTimes />
                    </button>
                </div>
                {cart.length === 0 ? (
                    <p className="text-xl text-[#8D6E63] text-center">Cart is empty</p>
                ) : (
                    <>
                        {cart.map(item => (
                            <div key={item.cartId} className="flex justify-between items-center py-3 border-b border-[#E6E2D3]">
                                <div className="flex items-center gap-4">
                                    <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-lg" />
                                    <div>
                                        <p className="text-xl text-[#5D4037]">{item.name}</p>
                                        <p className="text-lg text-[#8D6E63]">₹{item.price.toFixed(2)} x {item.quantity}</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => updateQuantity(item.cartId, -1)}
                                        className="bg-[#FFCDD2] hover:bg-[#EF9A9A] text-[#D32F2F] p-2 rounded-full"
                                        disabled={isLoading}
                                    >
                                        <FaMinus />
                                    </button>
                                    <button
                                        onClick={() => updateQuantity(item.cartId, 1)}
                                        className="bg-[#C8E6C9] hover:bg-[#A5D6A7] text-[#388E3C] p-2 rounded-full"
                                        disabled={isLoading}
                                    >
                                        <FaPlus />
                                    </button>
                                </div>
                            </div>
                        ))}
                        <div className="mt-6 text-right">
                            <span className="text-2xl font-bold text-[#5D4037]">Total: ₹{calculateTotal()}</span>
                        </div>
                        <button
                            onClick={placeOrder}
                            className={`w-full mt-6 bg-[#B2DFDB] hover:bg-[#80CBC4] text-[#00695C] text-xl font-semibold py-3 rounded-xl ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Placing Order...' : 'Buy Now'}
                        </button>
                    </>
                )}
            </div>
        </div>
    );

    return (
        <div className="p-6 bg-[#F5F5F5] min-h-screen">
            {/* Header with Title and Cart */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-4xl font-bold text-[#5D4037]">Emergency Needs</h1>
                <button
                    onClick={() => setIsCartOpen(true)}
                    className="bg-[#B2DFDB] hover:bg-[#80CBC4] text-[#00695C] text-xl font-semibold py-3 px-6 rounded-full shadow-lg flex items-center gap-3"
                    disabled={isLoading}
                >
                    <FaShoppingCart />
                
                    <span>₹{calculateTotal()}</span>
                </button>
            </div>

            {/* Search Bar */}
            <div className="mb-8 relative">
                <input
                    type="text"
                    placeholder="Search for items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-4 text-xl rounded-xl border border-[#E6E2D3] focus:outline-none focus:border-[#80CBC4] bg-[#FFF5F5] text-[#5D4037] placeholder-[#8D6E63]"
                    disabled={isLoading}
                />
                <FaSearch className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#8D6E63] text-xl" />
            </div>

            {/* Product Sections */}
            {sections.map(section => (
                <div key={section} className="mb-8">
                    <h2 className="text-3xl font-semibold text-[#5D4037] mb-4">{section}</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {filteredProducts
                            .filter(product => product.section === section)
                            .map(product => (
                                <div
                                    key={product.uid}
                                    className="bg-[#FFF5F5] p-4 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300"
                                >
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        className="w-full h-40 object-cover rounded-lg mb-3"
                                    />
                                    <div className="text-center">
                                        <h3 className="text-xl font-medium text-[#5D4037] mb-2">{product.name}</h3>
                                        <p className="text-lg text-[#8D6E63] mb-2">₹{product.price.toFixed(2)}</p>
                                        <div className="text-[#FFB300] text-xl mb-3">★ {product.rating}</div>
                                        <button
                                            onClick={() => addToCart(product)}
                                            className="w-full py-2 text-xl font-semibold rounded-lg bg-[#C8E6C9] hover:bg-[#A5D6A7] text-[#388E3C] shadow-md flex items-center justify-center gap-2"
                                            disabled={isLoading}
                                        >
                                            <FaShoppingCart /> Buy
                                        </button>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            ))}

            {/* Cart Modal */}
            {isCartOpen && <CartModal />}
        </div>
    );
}

export default DailyNeeds;