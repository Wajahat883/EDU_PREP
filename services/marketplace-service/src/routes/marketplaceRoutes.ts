import { Router, Request, Response } from "express";
import { tutorProfileService } from "../services/tutorProfileService";
import { courseListingService } from "../services/courseListingService";
import { marketplaceService } from "../services/marketplaceService";

const router = Router();

// Tutor Profile Routes

router.post("/tutors/profiles", (req: Request, res: Response) => {
  try {
    const { userId, name, bio, expertise, ratePerHour, headline } = req.body;
    const profile = tutorProfileService.createTutorProfile(
      userId,
      name,
      bio,
      expertise,
      ratePerHour,
      headline,
    );
    res.status(201).json({ success: true, profile });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put("/tutors/profiles/:tutorId", (req: Request, res: Response) => {
  try {
    const { bio, expertise, ratePerHour, headline, availability } = req.body;
    tutorProfileService.updateTutorProfile(
      req.params.tutorId,
      bio,
      expertise,
      ratePerHour,
      headline,
      availability,
    );
    res.json({ success: true, message: "Profile updated" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/tutors/profiles/:tutorId", (req: Request, res: Response) => {
  try {
    const profile = tutorProfileService.getTutorProfile(req.params.tutorId);
    res.json(profile);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

router.post(
  "/tutors/profiles/:tutorId/verify",
  (req: Request, res: Response) => {
    try {
      tutorProfileService.verifyTutor(req.params.tutorId);
      res.json({ success: true, message: "Tutor verified" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },
);

router.post(
  "/tutors/profiles/:tutorId/review",
  (req: Request, res: Response) => {
    try {
      const { studentId, studentName, rating, text } = req.body;
      tutorProfileService.addReview(
        req.params.tutorId,
        studentId,
        studentName,
        rating,
        text,
      );
      res.status(201).json({ success: true, message: "Review added" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },
);

router.get(
  "/tutors/profiles/:tutorId/reviews",
  (req: Request, res: Response) => {
    try {
      const reviews = tutorProfileService.getTutorReviews(req.params.tutorId);
      res.json({ reviews });
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  },
);

router.get("/tutors/search", (req: Request, res: Response) => {
  try {
    const { expertise, maxRate, minRating } = req.query;
    const tutors = tutorProfileService.searchTutors(
      expertise as string,
      maxRate ? parseInt(maxRate as string) : undefined,
      minRating ? parseFloat(minRating as string) : undefined,
    );
    res.json({ tutors });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/tutors/top", (req: Request, res: Response) => {
  try {
    const { limit } = req.query;
    const tutors = tutorProfileService.getTopTutors(
      limit ? parseInt(limit as string) : 50,
    );
    res.json({ tutors });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/tutors/sessions/schedule", (req: Request, res: Response) => {
  try {
    const { tutorId, studentId, studentName, scheduledDate, duration } =
      req.body;
    const session = tutorProfileService.scheduleSession(
      tutorId,
      studentId,
      studentName,
      new Date(scheduledDate),
      duration,
    );
    res.status(201).json({ success: true, session });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post(
  "/tutors/sessions/:sessionId/complete",
  (req: Request, res: Response) => {
    try {
      tutorProfileService.completeSession(req.params.sessionId);
      res.json({ success: true, message: "Session completed" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },
);

// Course Listing Routes

router.post("/courses", (req: Request, res: Response) => {
  try {
    const {
      instructorId,
      instructorName,
      title,
      description,
      category,
      price,
      level,
    } = req.body;
    const course = courseListingService.createCourseListing(
      instructorId,
      instructorName,
      title,
      description,
      category,
      price,
      level,
    );
    res.status(201).json({ success: true, course });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/courses/:courseId/publish", (req: Request, res: Response) => {
  try {
    courseListingService.publishCourse(req.params.courseId);
    res.json({ success: true, message: "Course published" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/courses/:courseId/lesson", (req: Request, res: Response) => {
  try {
    const { title, videoUrl, duration, resources } = req.body;
    courseListingService.addLesson(
      req.params.courseId,
      title,
      videoUrl,
      duration,
      resources,
    );
    res.status(201).json({ success: true, message: "Lesson added" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/courses/:courseId", (req: Request, res: Response) => {
  try {
    const course = courseListingService.getCourseListing(req.params.courseId);
    res.json(course);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

router.get("/courses/:courseId/lessons", (req: Request, res: Response) => {
  try {
    const lessons = courseListingService.getCourseLessons(req.params.courseId);
    res.json({ lessons });
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

router.get("/courses/search", (req: Request, res: Response) => {
  try {
    const { query, category, level, maxPrice, minRating } = req.query;
    const courses = courseListingService.searchCourses(
      query as string,
      category as string,
      level as string,
      maxPrice ? parseFloat(maxPrice as string) : undefined,
      minRating ? parseFloat(minRating as string) : undefined,
    );
    res.json({ courses });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/courses/popular", (req: Request, res: Response) => {
  try {
    const { limit } = req.query;
    const courses = courseListingService.getPopularCourses(
      limit ? parseInt(limit as string) : 50,
    );
    res.json({ courses });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/courses/:courseId/enroll", (req: Request, res: Response) => {
  try {
    const { studentId, studentName } = req.body;
    courseListingService.enrollStudent(
      req.params.courseId,
      studentId,
      studentName,
    );
    res.json({ success: true, message: "Enrolled in course" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/courses/:courseId/progress", (req: Request, res: Response) => {
  try {
    const { studentId, lessonsCompleted } = req.body;
    courseListingService.updateProgress(
      req.params.courseId,
      studentId,
      lessonsCompleted,
    );
    res.json({ success: true, message: "Progress updated" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/courses/:courseId/review", (req: Request, res: Response) => {
  try {
    const { studentId, studentName, rating, text } = req.body;
    courseListingService.addReview(
      req.params.courseId,
      studentId,
      studentName,
      rating,
      text,
    );
    res.status(201).json({ success: true, message: "Review added" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/courses/:courseId/reviews", (req: Request, res: Response) => {
  try {
    const reviews = courseListingService.getCourseReviews(req.params.courseId);
    res.json({ reviews });
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

router.post("/courses/:courseId/promote", (req: Request, res: Response) => {
  try {
    const { durationDays } = req.body;
    courseListingService.promoteCourse(req.params.courseId, durationDays);
    res.json({ success: true, message: "Course promoted" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Marketplace Routes

router.post("/marketplace/products", (req: Request, res: Response) => {
  try {
    const {
      sellerId,
      sellerName,
      name,
      description,
      category,
      price,
      quantity,
    } = req.body;
    const product = marketplaceService.listProduct(
      sellerId,
      sellerName,
      name,
      description,
      category,
      price,
      quantity,
    );
    res.status(201).json({ success: true, product });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/marketplace/products/search", (req: Request, res: Response) => {
  try {
    const { query, category, maxPrice, minRating } = req.query;
    const products = marketplaceService.searchProducts(
      query as string,
      category as string,
      maxPrice ? parseFloat(maxPrice as string) : undefined,
      minRating ? parseFloat(minRating as string) : undefined,
    );
    res.json({ products });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get(
  "/marketplace/products/:productId",
  (req: Request, res: Response) => {
    try {
      const product = marketplaceService.getProduct(req.params.productId);
      res.json(product);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  },
);

router.post("/marketplace/cart/add", (req: Request, res: Response) => {
  try {
    const { userId, productId, quantity } = req.body;
    marketplaceService.addToCart(userId, productId, quantity);
    res.json({ success: true, message: "Item added to cart" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/marketplace/cart/remove", (req: Request, res: Response) => {
  try {
    const { userId, productId } = req.body;
    marketplaceService.removeFromCart(userId, productId);
    res.json({ success: true, message: "Item removed from cart" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/marketplace/cart/:userId", (req: Request, res: Response) => {
  try {
    const cart = marketplaceService.getCart(req.params.userId);
    res.json(cart);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

router.post("/marketplace/checkout", (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    const result = marketplaceService.checkout(userId);
    res.json({ success: true, result });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post(
  "/marketplace/products/:productId/review",
  (req: Request, res: Response) => {
    try {
      const { buyerId, buyerName, rating, text } = req.body;
      marketplaceService.addReview(
        req.params.productId,
        buyerId,
        buyerName,
        rating,
        text,
      );
      res.status(201).json({ success: true, message: "Review added" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },
);

router.get(
  "/marketplace/products/:productId/reviews",
  (req: Request, res: Response) => {
    try {
      const reviews = marketplaceService.getProductReviews(
        req.params.productId,
      );
      res.json({ reviews });
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  },
);

router.post("/marketplace/wishlist/add", (req: Request, res: Response) => {
  try {
    const { userId, productId } = req.body;
    marketplaceService.addToWishlist(userId, productId);
    res.json({ success: true, message: "Item added to wishlist" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/marketplace/wishlist/:userId", (req: Request, res: Response) => {
  try {
    const wishlist = marketplaceService.getWishlist(req.params.userId);
    res.json({ wishlist });
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

router.get(
  "/marketplace/seller/:sellerId/sales",
  (req: Request, res: Response) => {
    try {
      const sales = marketplaceService.getSellerSales(req.params.sellerId);
      res.json(sales);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  },
);

export default router;
