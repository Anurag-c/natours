const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const APIFeatures = require('./../utils/apiFeatures');
// the returned function still has access to model due to closures
exports.deleteOne = (Model) => {
    return catchAsync(async (req, res, next) => {
        const doc = await Model.findByIdAndDelete(req.params.id);

        if (!doc) {
            return next(new AppError('No document found with that ID', 404));
        }

        res.status(200).json({
            status: 'success',
            data: null
        });
    });
};

exports.updateOne = (Model) => {
    return catchAsync(async (req, res, next) => {
        const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!doc) {
            return next(new AppError('No document found with that ID', 404));
        }

        res.status(200).json({
            status: 'success',
            data: {
                data: doc
            }
        });
    });
};

exports.createOne = (Model) => {
    return catchAsync(async (req, res, next) => {
        const doc = await Model.create(req.body);

        res.status(200).json({
            status: 'success',
            data: {
                data: doc
            }
        });
    });
};

exports.getOne = (Model, popOptions) => {
    return catchAsync(async (req, res, next) => {
        let query = Model.findById(req.params.id);
        if (popOptions) query = query.populate('reviews');
        //findOne({_id : req.params.id})
        const doc = await query;
        if (!doc) {
            return next(new AppError('No document found with that ID', 404));
        }

        res.status(200).json({
            status: 'success',
            data: {
                data: doc
            }
        });
    });
};

exports.getAll = (Model) => {
    return catchAsync(async (req, res, next) => {
        //To allow fro nested get Reviews on Tour
        let filter = {};
        if (req.params.tourId) filter = { tour: req.params.tourId };

        const features = new APIFeatures(Model.find(filter), req.query);
        features.filter().sort().limitFields().paginate();

        //EXECUTE QUERY
        const doc = await features.query;

        res.status(200).json({
            status: 'success',
            results: doc.length,
            data: {
                data: doc
            }
        });
    });
};
