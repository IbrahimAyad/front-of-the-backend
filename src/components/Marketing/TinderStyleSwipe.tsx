import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Paper,
  IconButton,
} from '@mui/material';
import {
  Favorite,
  Close,
  CheckCircle,
  Cancel,
  Refresh,
} from '@mui/icons-material';

// --- TYPE DEFINITIONS --- //
interface FormState {
  name: string;
  email: string;
}

interface FormStatus {
  submitted: boolean;
  message: string;
}

interface Product {
  id: number;
  name: string;
  imageUrl: string;
  isCorrect: boolean;
  category: string;
}

interface SwipeConfig {
  eventType: string;
  eventTitle: string;
  description: string;
}

// --- MOCK PRODUCT DATA --- //
const productDatabase: Record<string, Product[]> = {
  blackTie: [
    // Correct items for Black Tie Optional
    { id: 1, name: "Classic Black Tuxedo", imageUrl: "https://images.unsplash.com/photo-1593012164573-2a4b9a89d7ca?q=80&w=400", isCorrect: true, category: "formal" },
    { id: 2, name: "Navy Dinner Jacket", imageUrl: "https://images.unsplash.com/photo-1617137968427-85924c800a22?q=80&w=400", isCorrect: true, category: "formal" },
    { id: 3, name: "White Dress Shirt", imageUrl: "https://images.unsplash.com/photo-1621288316394-13189308bb59?q=80&w=400", isCorrect: true, category: "formal" },
    { id: 4, name: "Black Bow Tie", imageUrl: "https://images.unsplash.com/photo-1611086111124-de47355b9a81?q=80&w=400", isCorrect: true, category: "formal" },
    { id: 5, name: "Patent Leather Shoes", imageUrl: "https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=400", isCorrect: true, category: "formal" },
    { id: 6, name: "Midnight Blue Tuxedo", imageUrl: "https://images.unsplash.com/photo-1521115143362-5e7aB47a7b8a?q=80&w=400", isCorrect: true, category: "formal" },
    { id: 7, name: "Formal Cufflinks", imageUrl: "https://images.unsplash.com/photo-1611652492505-1a3b5c13e51a?q=80&w=400", isCorrect: true, category: "formal" },
    
    // Incorrect items for Black Tie Optional
    { id: 8, name: "Casual Polo Shirt", imageUrl: "https://images.unsplash.com/photo-1618641753443-a4137c481946?q=80&w=400", isCorrect: false, category: "casual" },
    { id: 9, name: "Denim Jeans", imageUrl: "https://images.unsplash.com/photo-1594938384218-c2d4a5c6a1e8?q=80&w=400", isCorrect: false, category: "casual" },
    { id: 10, name: "Sneakers", imageUrl: "https://images.unsplash.com/photo-1596543542753-2e061730424a?q=80&w=400", isCorrect: false, category: "casual" },
    { id: 11, name: "Baseball Cap", imageUrl: "https://images.unsplash.com/photo-1627488094200-348a7b6b1076?q=80&w=400", isCorrect: false, category: "casual" },
    { id: 12, name: "Flip Flops", imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400", isCorrect: false, category: "casual" },
  ],
  business: [
    // Business casual correct items
    { id: 13, name: "Navy Blazer", imageUrl: "https://images.unsplash.com/photo-1617137968427-85924c800a22?q=80&w=400", isCorrect: true, category: "business" },
    { id: 14, name: "Dress Shirt", imageUrl: "https://images.unsplash.com/photo-1621288316394-13189308bb59?q=80&w=400", isCorrect: true, category: "business" },
    { id: 15, name: "Chinos", imageUrl: "https://images.unsplash.com/photo-1562887259-d5e34b07c87c?q=80&w=400", isCorrect: true, category: "business" },
    { id: 16, name: "Leather Loafers", imageUrl: "https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=400", isCorrect: true, category: "business" },
    { id: 17, name: "Knit Tie", imageUrl: "https://images.unsplash.com/photo-1611086111124-de47355b9a81?q=80&w=400", isCorrect: true, category: "business" },
    { id: 18, name: "Wool Sweater", imageUrl: "https://images.unsplash.com/photo-1611652492505-1a3b5c13e51a?q=80&w=400", isCorrect: true, category: "business" },
    { id: 19, name: "Oxford Shoes", imageUrl: "https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=400", isCorrect: true, category: "business" },
    
    // Business casual incorrect items
    { id: 20, name: "Formal Tuxedo", imageUrl: "https://images.unsplash.com/photo-1593012164573-2a4b9a89d7ca?q=80&w=400", isCorrect: false, category: "formal" },
    { id: 21, name: "Gym Shorts", imageUrl: "https://images.unsplash.com/photo-1594938384218-c2d4a5c6a1e8?q=80&w=400", isCorrect: false, category: "casual" },
    { id: 22, name: "Tank Top", imageUrl: "https://images.unsplash.com/photo-1618641753443-a4137c481946?q=80&w=400", isCorrect: false, category: "casual" },
    { id: 23, name: "Flip Flops", imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400", isCorrect: false, category: "casual" },
    { id: 24, name: "White Bow Tie", imageUrl: "https://images.unsplash.com/photo-1611086111124-de47355b9a81?q=80&w=400", isCorrect: false, category: "formal" },
  ]
};

const eventConfigs: Record<string, SwipeConfig> = {
  blackTie: {
    eventType: 'blackTie',
    eventTitle: 'Black Tie Optional',
    description: 'Test your knowledge of formal evening wear'
  },
  business: {
    eventType: 'business',
    eventTitle: 'Business Casual',
    description: 'Do you know what works for the modern workplace?'
  },
  wedding: {
    eventType: 'wedding',
    eventTitle: 'Wedding Guest',
    description: 'Perfect attire for celebrating love'
  },
  cocktail: {
    eventType: 'cocktail',
    eventTitle: 'Cocktail Party',
    description: 'Smart casual elegance for social events'
  },
  casual: {
    eventType: 'casual',
    eventTitle: 'Smart Casual',
    description: 'Elevated everyday style'
  }
};

// --- SWIPE CARD COMPONENT --- //
const SwipeCard: React.FC<{ 
  product: Product; 
  onSwipe: (direction: 'left' | 'right') => void;
  isTop: boolean;
}> = ({ product, onSwipe, isTop }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState({});
  const [stampOpacity, setStampOpacity] = useState({ like: 0, nope: 0 });

  useEffect(() => {
    if (!isTop) return;
    
    const el = cardRef.current;
    if (!el) return;

    let startX = 0;
    let isDragging = false;

    const onDragStart = (e: MouseEvent | TouchEvent) => {
      isDragging = true;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      startX = clientX;
      el.style.transition = 'none';
    };

    const onDragMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      e.preventDefault();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const deltaX = clientX - startX;
      const rotate = deltaX / 20;
      const likeOpacity = Math.max(0, deltaX / 100);
      const nopeOpacity = Math.max(0, -deltaX / 100);

      setStyle({ transform: `translateX(${deltaX}px) rotate(${rotate}deg)` });
      setStampOpacity({ like: likeOpacity, nope: nopeOpacity });
    };

    const onDragEnd = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      isDragging = false;
      const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : e.clientX;
      const deltaX = clientX - startX;
      el.style.transition = 'transform 0.5s ease-out';

      if (Math.abs(deltaX) > 100) {
        const direction = deltaX > 0 ? 'right' : 'left';
        const flyOutX = (deltaX > 0 ? 1 : -1) * 500;
        setStyle({ transform: `translateX(${flyOutX}px) rotate(${deltaX / 10}deg)` });
        setTimeout(() => onSwipe(direction), 200);
      } else {
        setStyle({ transform: 'translateX(0px) rotate(0deg)' });
        setStampOpacity({ like: 0, nope: 0 });
      }
    };

    el.addEventListener('mousedown', onDragStart);
    document.addEventListener('mousemove', onDragMove);
    document.addEventListener('mouseup', onDragEnd);
    
    el.addEventListener('touchstart', onDragStart, { passive: true });
    el.addEventListener('touchmove', onDragMove, { passive: false });
    el.addEventListener('touchend', onDragEnd);

    return () => {
      el.removeEventListener('mousedown', onDragStart);
      document.removeEventListener('mousemove', onDragMove);
      document.removeEventListener('mouseup', onDragEnd);
      el.removeEventListener('touchstart', onDragStart);
      el.removeEventListener('touchmove', onDragMove);
      el.removeEventListener('touchend', onDragEnd);
    };
  }, [onSwipe, isTop]);

  return (
    <Card 
      ref={cardRef}
      style={style}
      sx={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        cursor: isTop ? 'grab' : 'default',
        '&:active': { cursor: isTop ? 'grabbing' : 'default' },
        zIndex: isTop ? 10 : 1,
        transform: isTop ? 'scale(1)' : 'scale(0.95)',
        opacity: isTop ? 1 : 0.7,
      }}
    >
      {/* Stamps */}
      <Box
        sx={{
          position: 'absolute',
          top: 32,
          left: 32,
          border: '4px solid #4caf50',
          color: '#4caf50',
          fontWeight: 'bold',
          fontSize: '24px',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          p: 1,
          borderRadius: 2,
          transform: 'rotate(-12deg)',
          opacity: stampOpacity.like,
          zIndex: 20,
        }}
      >
        LIKE
      </Box>
      <Box
        sx={{
          position: 'absolute',
          top: 32,
          right: 32,
          border: '4px solid #f44336',
          color: '#f44336',
          fontWeight: 'bold',
          fontSize: '24px',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          p: 1,
          borderRadius: 2,
          transform: 'rotate(12deg)',
          opacity: stampOpacity.nope,
          zIndex: 20,
        }}
      >
        NOPE
      </Box>

      <Box
        component="img"
        src={product.imageUrl}
        alt={product.name}
        sx={{
          width: '100%',
          height: '60%',
          objectFit: 'cover',
          pointerEvents: 'none',
        }}
      />
      <CardContent sx={{ height: '40%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          {product.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Category: {product.category}
        </Typography>
      </CardContent>
    </Card>
  );
};

// --- MAIN COMPONENT --- //
interface TinderStyleSwipeProps {
  eventType?: string;
  onComplete?: (results: { score: number; total: number; passed: boolean }) => void;
}

const TinderStyleSwipe: React.FC<TinderStyleSwipeProps> = ({ 
  eventType = 'blackTie', 
  onComplete 
}) => {
  const [currentEventType, setCurrentEventType] = useState(eventType);
  const [products, setProducts] = useState<Product[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [formState, setFormState] = useState<FormState>({ name: '', email: '' });
  const [formStatus, setFormStatus] = useState<FormStatus>({ submitted: false, message: '' });

  const config = eventConfigs[currentEventType];
  const currentProduct = products[currentIndex];
  const progress = products.length > 0 ? ((currentIndex) / products.length) * 100 : 0;

  // Initialize products when event type changes
  useEffect(() => {
    const eventProducts = productDatabase[currentEventType] || productDatabase.blackTie;
    // Shuffle and take 12 products
    const shuffled = [...eventProducts].sort(() => Math.random() - 0.5).slice(0, 12);
    setProducts(shuffled);
    setCurrentIndex(0);
    setScore(0);
    setGameComplete(false);
  }, [currentEventType]);

  const handleSwipe = (direction: 'left' | 'right') => {
    if (!currentProduct) return;

    // Right swipe = "would wear", Left swipe = "wouldn't wear"
    const userChoice = direction === 'right';
    const isCorrectChoice = userChoice === currentProduct.isCorrect;
    
    if (isCorrectChoice) {
      setScore(prev => prev + 1);
    }

    const nextIndex = currentIndex + 1;
    if (nextIndex >= products.length) {
      // Game complete
      const finalScore = isCorrectChoice ? score + 1 : score;
      const passed = finalScore >= Math.ceil(products.length * 0.6); // 60% to pass
      setGameComplete(true);
      onComplete?.({ score: finalScore, total: products.length, passed });
    } else {
      setCurrentIndex(nextIndex);
    }
  };

  const handleButtonSwipe = (direction: 'left' | 'right') => {
    handleSwipe(direction);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formState.name || !formState.email) {
      setFormStatus({ submitted: false, message: 'Please fill in both fields.' });
      return;
    }
    setFormStatus({ 
      submitted: true, 
      message: `Thanks, ${formState.name}! Your personalized style guide is on its way.` 
    });
  };

  const resetGame = () => {
    const eventProducts = productDatabase[currentEventType] || productDatabase.blackTie;
    const shuffled = [...eventProducts].sort(() => Math.random() - 0.5).slice(0, 12);
    setProducts(shuffled);
    setCurrentIndex(0);
    setScore(0);
    setGameComplete(false);
    setFormStatus({ submitted: false, message: '' });
  };

  if (gameComplete) {
    const passed = score >= Math.ceil(products.length * 0.6);
    const percentage = Math.round((score / products.length) * 100);

    return (
      <Box sx={{ maxWidth: 600, mx: 'auto', p: 3, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>
          Game Complete!
        </Typography>
        
        <Paper sx={{ p: 4, mb: 3, bgcolor: passed ? '#e8f5e8' : '#fff3e0' }}>
          <Typography variant="h2" fontWeight="bold" color={passed ? 'success.main' : 'warning.main'}>
            {percentage}%
          </Typography>
          <Typography variant="h6" gutterBottom>
            You got {score} out of {products.length} correct
          </Typography>
          
          {passed ? (
            <Box>
              <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
              <Typography variant="h5" gutterBottom color="success.main">
                Excellent Style Knowledge!
              </Typography>
              <Typography variant="body1">
                You clearly know what works for a {config.eventTitle} event. Your style instincts are on point!
              </Typography>
            </Box>
          ) : (
            <Box>
              <Cancel sx={{ fontSize: 48, color: 'warning.main', mb: 2 }} />
              <Typography variant="h5" gutterBottom color="warning.main">
                Room for Improvement
              </Typography>
              <Typography variant="body1" gutterBottom>
                Don't worry! Style rules can be tricky. Let us help you master the perfect {config.eventTitle} look.
              </Typography>
              <Button 
                variant="contained" 
                color="primary" 
                sx={{ mt: 2 }}
                onClick={() => window.open('/style-guide', '_blank')}
              >
                Get Your Style Guide
              </Button>
            </Box>
          )}
        </Paper>

        {!formStatus.submitted ? (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Get Your Personalized Style Guide
            </Typography>
            <form onSubmit={handleSubmit}>
              <Box sx={{ display: 'flex', gap: 2, mb: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={formState.name}
                  onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                  required
                />
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={formState.email}
                  onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                  required
                />
              </Box>
              {formStatus.message && (
                <Typography color="error" variant="body2" sx={{ mb: 2 }}>
                  {formStatus.message}
                </Typography>
              )}
              <Button type="submit" variant="contained" fullWidth>
                Send My Style Guide
              </Button>
            </form>
          </Paper>
        ) : (
          <Paper sx={{ p: 3, mb: 3, bgcolor: '#e8f5e8' }}>
            <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
            <Typography variant="h6" color="success.main">
              {formStatus.message}
            </Typography>
          </Paper>
        )}

        <Button 
          variant="outlined" 
          startIcon={<Refresh />} 
          onClick={resetGame}
          sx={{ mr: 2 }}
        >
          Play Again
        </Button>
        
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Try Different Event</InputLabel>
          <Select
            value={currentEventType}
            onChange={(e) => setCurrentEventType(e.target.value)}
            label="Try Different Event"
          >
            {Object.entries(eventConfigs).map(([key, config]) => (
              <MenuItem key={key} value={key}>
                {config.eventTitle}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', p: 3 }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Style Match Game
        </Typography>
        <Typography variant="h6" color="primary" gutterBottom>
          {config.eventTitle}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {config.description}
        </Typography>
        
        {/* Progress */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
          <Typography variant="body2">
            {currentIndex + 1} / {products.length}
          </Typography>
          <Box sx={{ flex: 1, bgcolor: '#f0f0f0', borderRadius: 1, height: 8 }}>
            <Box 
              sx={{ 
                width: `${progress}%`, 
                bgcolor: 'primary.main', 
                height: '100%', 
                borderRadius: 1,
                transition: 'width 0.3s ease'
              }} 
            />
          </Box>
          <Typography variant="body2" color="success.main">
            Score: {score}
          </Typography>
        </Box>
      </Box>

      {/* Card Stack */}
      <Box sx={{ position: 'relative', height: 500, mb: 3 }}>
        {products.slice(currentIndex, currentIndex + 2).map((product, index) => (
          <SwipeCard
            key={product.id}
            product={product}
            onSwipe={handleSwipe}
            isTop={index === 0}
          />
        ))}
      </Box>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3 }}>
        <IconButton
          size="large"
          onClick={() => handleButtonSwipe('left')}
          sx={{
            bgcolor: '#f44336',
            color: 'white',
            '&:hover': { bgcolor: '#d32f2f' },
            width: 64,
            height: 64,
          }}
        >
          <Close sx={{ fontSize: 32 }} />
        </IconButton>
        
        <IconButton
          size="large"
          onClick={() => handleButtonSwipe('right')}
          sx={{
            bgcolor: '#4caf50',
            color: 'white',
            '&:hover': { bgcolor: '#388e3c' },
            width: 64,
            height: 64,
          }}
        >
          <Favorite sx={{ fontSize: 32 }} />
        </IconButton>
      </Box>

      <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 2 }}>
        Swipe right (❤️) if you'd wear this to a {config.eventTitle} event, left (✖️) if you wouldn't
      </Typography>
    </Box>
  );
};

export default TinderStyleSwipe; 