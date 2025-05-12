export interface Recipe {
    id: string;
    title: string;
    description: string;
    time: string;
    difficulty: string;
    categories: string[];
    imageUrl: string;
    alt: string;
    rate: string;
    ingredients: { ingredient: string; quantity: string; }[];
    steps: string[];
    chefName: string;
    chefImage: string;
    user_id: string;
}