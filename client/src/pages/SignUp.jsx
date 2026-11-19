import { Link, useNavigate } from 'react-router';
import { useAuth } from '../auth';
import AuthForm from '../components/AuthForm';

const SignUp = () => {
    const { signup } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (email, password) => {
        await signup(email, password);
        navigate('/dashboard', { replace: true });
    };

    return (
        <AuthForm
            title="Regisztráció"
            buttonLabel="Regisztráció"
            onSubmit={handleSubmit}
            footer={<>Van már fiókod? <Link to="/signin">Bejelentkezés</Link></>}
        />
    );
};

export default SignUp;
